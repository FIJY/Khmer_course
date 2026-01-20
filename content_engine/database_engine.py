import os
import sys
import re
import asyncio
import hashlib
import time
from supabase import create_client, Client
from dotenv import load_dotenv
import edge_tts
from pathlib import Path

# --- КОНФИГУРАЦИЯ ---
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not key:
    key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

VOICE = "km-KH-PisethNeural"
SPEED = "-10%"
KHMER_PATTERN = re.compile(r"[\u1780-\u17FF]")

AUDIO_DIR = Path(__file__).resolve().parent.parent / "khmer-mastery" / "public" / "sounds"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

if not url or not key:
    print(f"❌ ОШИБКА: Нет ключей Supabase в {env_path.absolute()}")
    sys.exit(1)

supabase: Client = create_client(url, key)


# --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

def db_execute_retry(query, retries=5, delay=2):
    """Выполняет запрос с повторными попытками (спасает от 502 error)"""
    last_error = None
    for attempt in range(retries):
        try:
            return query.execute()
        except Exception as e:
            last_error = e
            err_str = str(e)
            if "Network" in err_str or "502" in err_str or "500" in err_str or "connection" in err_str.lower():
                print(f"   ⚠️ DB Network error (попытка {attempt + 1}/{retries}), ждем {delay} сек...")
                time.sleep(delay)
            else:
                raise e
    print(f"❌ Не удалось выполнить запрос после {retries} попыток.")
    raise last_error


def get_safe_audio_name(khmer_text, english_label=None):
    clean_k = khmer_text.split(' (')[0].replace('?', '').strip()
    label = english_label or "audio"
    safe_label = re.sub(r'[\\/*?:"<>|]', "", label).lower().strip().replace(' ', '_')[:15]
    w_hash = hashlib.md5(clean_k.encode()).hexdigest()[:4]
    return f"{safe_label}_{w_hash}.mp3"


def get_item_type(khmer_text, english_text):
    clean = khmer_text.split(' (')[0].strip()
    if '?' in clean or clean.count(' ') >= 2: return 'sentence'
    if any(char.isdigit() for char in (english_text or "")): return 'number'
    if clean in ["សួស្តី", "ជំរាបសួរ", "អរគុណ", "បាទ", "ចាស"]: return 'phrase'
    return 'word'


def resolve_khmer_english(item_type, data):
    if item_type == "vocab_card":
        front = data.get("front", "") or ""
        back = data.get("back", "") or ""
        if KHMER_PATTERN.search(front): return front, back
        return back, front
    return data.get("correct_answer", "") or "", "Quiz Answer"


async def generate_audio(text, filename):
    filepath = AUDIO_DIR / filename
    if filepath.exists(): return
    clean_text = text.split(' (')[0].replace('?', '').strip()
    if not clean_text: return
    try:
        await edge_tts.Communicate(clean_text, VOICE, rate=SPEED).save(filepath)
        print(f"   ✅ Audio created: {filename}")
    except Exception as e:
        print(f"   ⚠️ TTS Error: {e}")
        if filepath.exists(): filepath.unlink()


# --- ОСНОВНЫЕ ФУНКЦИИ ---

async def seed_lesson(lesson_id, title, desc, content_list, module_id=None, order_index=0):
    print(f"🚀 Processing Lesson {lesson_id}: {title}...")

    # 1. UPSERT УРОКА
    db_execute_retry(supabase.table("lessons").upsert({
        "id": lesson_id, "title": title, "description": desc,
        "module_id": module_id, "order_index": order_index
    }, on_conflict="id"))

    # 2. ЧИСТКА СТАРЫХ ДАННЫХ
    existing = db_execute_retry(supabase.table("lesson_items").select("id").eq("lesson_id", lesson_id))
    ids = [i['id'] for i in existing.data]
    if ids:
        for table in ["user_srs", "user_srs_items"]:
            try:
                db_execute_retry(supabase.table(table).delete().in_("item_id", ids))
            except:
                pass
        db_execute_retry(supabase.table("lesson_items").delete().eq("lesson_id", lesson_id))

    # 3. ВСТАВКА КОНТЕНТА
    for idx, item in enumerate(content_list):
        # А) ОБРАБОТКА КВИЗОВ
        if item['type'] == 'quiz':
            options = item['data'].get('options', [])
            pron_map = item['data'].get('pronunciation_map', {})

            item['data']['options_metadata'] = {}
            for opt in options:
                clean_opt = opt.split(' (')[0].replace('?', '').strip()
                dict_res = db_execute_retry(
                    supabase.table("dictionary").select("pronunciation", "english").eq("khmer", clean_opt))
                entry = dict_res.data[0] if dict_res.data else {}

                db_pron = entry.get("pronunciation", "")
                eng = entry.get("english", "option")
                json_pron = pron_map.get(clean_opt, "")

                if json_pron:
                    pron = json_pron
                    if pron != db_pron:
                        try:
                            db_execute_retry(supabase.table("dictionary").upsert({
                                "khmer": clean_opt,
                                "pronunciation": pron,
                                "english": eng if eng != "option" else "Quiz Option",
                                "item_type": "word"
                            }, on_conflict="khmer"))
                        except:
                            pass
                else:
                    pron = db_pron

                audio_name = get_safe_audio_name(clean_opt, eng)
                await generate_audio(clean_opt, audio_name)

                item['data']['options_metadata'][opt] = {
                    "audio": audio_name,
                    "pronunciation": pron
                }

        # Б) ОБРАБОТКА VOCAB И КАРТОЧЕК
        if item['type'] in ['vocab_card', 'quiz']:
            khmer, english = resolve_khmer_english(item['type'], item['data'])
            if khmer:
                clean_k = khmer.split(' (')[0].replace('?', '').strip()
                dict_res = db_execute_retry(
                    supabase.table("dictionary").select("pronunciation", "english").eq("khmer", clean_k))
                entry = dict_res.data[0] if dict_res.data else {}

                json_pron = item['data'].get("pronunciation", "")
                if json_pron:
                    final_pron = json_pron
                else:
                    final_pron = entry.get("pronunciation", "")

                item['data']['pronunciation'] = final_pron
                english = entry.get("english", english)

                audio_name = get_safe_audio_name(clean_k, english)
                await generate_audio(clean_k, audio_name)
                item['data']['audio'] = audio_name

                db_execute_retry(supabase.table("dictionary").upsert({
                    "khmer": clean_k,
                    "english": english,
                    "pronunciation": final_pron,
                    "item_type": get_item_type(clean_k, english)
                }, on_conflict="khmer"))

        # Б2) НОВОЕ: Генерация аудио для Learn Char и Inventory
        # Если в JSON есть поле audio (например "ka.mp3"), мы генерируем реальный файл и подменяем имя
        if item['type'] in ['learn_char', 'word_breakdown']:
            data = item.get('data', {})
            # Если это буква
            char_text = data.get('char')
            if char_text:
                audio_name = get_safe_audio_name(char_text, f"char_{data.get('name', 'unknown')}")
                await generate_audio(char_text, audio_name)
                item['data']['audio'] = audio_name

            # Если это слово (Inventory)
            word_text = data.get('word')
            if word_text:
                audio_name = get_safe_audio_name(word_text, f"word_{data.get('translation', 'unknown')}")
                await generate_audio(word_text, audio_name)
                item['data']['audio'] = audio_name


        # Запись карточки
        db_execute_retry(supabase.table("lesson_items").insert({
            "lesson_id": lesson_id, "type": item['type'],
            "order_index": idx, "data": item['data']
        }))

    # 4. ВАЖНО: Обновляем JSON в таблице lessons, чтобы Fallback тоже имел правильные ссылки на аудио!
    try:
        db_execute_retry(supabase.table("lessons").update({
            "content": content_list  # <-- Тут уже лежат сгенерированные имена аудио
        }).eq("id", lesson_id))
        print(f"   💾 Updated lesson content JSON for fallback compatibility.")
    except Exception as e:
        print(f"   ⚠️ Could not update lesson content JSON: {e}")

    print(f"🎉 Lesson {lesson_id} synced!")


async def update_study_materials(module_id, lessons_data):
    """
    1. Обновляет текстовое саммари.
    2. 🔥 ГЕНЕРИРУЕТ СВОДНЫЙ УРОК ДЛЯ ГЛАВЫ (ID = module_id)
       чтобы кнопка 'Книжечка' показывала ВСЕ слова главы.
    """
    print(f"\n📘 Updating Summary & Guidebook for Module {module_id}...")

    summary_text = f"# Chapter Summary\n\n"

    # Собираем все уникальные карточки для сводного урока
    aggregated_items = []
    seen_words = set()

    sorted_lessons = sorted(lessons_data.items(), key=lambda x: x[0])

    for lesson_id, info in sorted_lessons:
        # Пропускаем финальный квиз в сводке слов
        if "Final Quiz" in info.get('title', ''):
            continue

        lesson_title = info.get('title', f'Lesson {lesson_id}')
        summary_text += f"## {lesson_title}\n"

        # Добавляем теорию в текст
        for item in info.get('content', []):
            if item['type'] == 'theory':
                t_title = item['data'].get('title', 'Note')
                t_text = item['data'].get('text', '')
                summary_text += f"* 💡 **{t_title}**: {t_text}\n"
                # Теорию тоже добавляем в карточки для превью
                aggregated_items.append(item)

        summary_text += "\n"

        # Добавляем слова
        for item in info.get('content', []):
            if item['type'] == 'vocab_card':
                data = item.get('data', {})
                khmer = data.get('back', '')
                eng = data.get('front', '')
                pron = data.get('pronunciation', '')

                # Добавляем в текст
                if khmer and eng:
                    summary_text += f"* **{khmer}** ({pron}) — {eng}\n"

                # Добавляем в список карточек (без дублей)
                if khmer not in seen_words:
                    seen_words.add(khmer)
                    # Копируем элемент, чтобы сохранить аудио и метаданные
                    aggregated_items.append(item)

        summary_text += "\n"

    # 1. Записываем текстовое саммари
    try:
        db_execute_retry(supabase.table("study_materials").upsert({
            "chapter_id": module_id,
            "title": f"Summary: Module {module_id}",
            "content": summary_text,
            "type": "summary"
        }, on_conflict="chapter_id"))
        print(f"✅ Text summary updated!")
    except Exception as e:
        print(f"⚠️ Failed to update study_materials: {e}")

    # 2. 🔥 ПЕРЕЗАПИСЫВАЕМ УРОК-ГЛАВУ (ID = module_id, например 1)
    # Это то, что открывает кнопка Книжечки
    print(f"🔄 Regenerating Chapter Guidebook (Lesson ID {module_id})...")

    # Чистим старые "6 слов"
    existing = db_execute_retry(supabase.table("lesson_items").select("id").eq("lesson_id", module_id))
    ids = [i['id'] for i in existing.data]
    if ids:
        db_execute_retry(supabase.table("lesson_items").delete().eq("lesson_id", module_id))

    # Вставляем все собранные слова
    for idx, item in enumerate(aggregated_items):
        db_execute_retry(supabase.table("lesson_items").insert({
            "lesson_id": module_id,
            "type": item['type'],
            "order_index": idx,
            "data": item['data']
        }))

    print(f"✅ Guidebook (Lesson {module_id}) filled with {len(aggregated_items)} items!")