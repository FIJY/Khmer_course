import os
import sys
import re
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv
import edge_tts
from pathlib import Path
import hashlib

# --- КОНФИГУРАЦИЯ ---
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Приоритет Service Role для удаления/записи
if not key:
    key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

VOICE = "km-KH-PisethNeural"
SPEED = "-10%"
KHMER_PATTERN = re.compile(r"[\u1780-\u17FF]")
# Путь к папке sounds в твоем React-проекте
AUDIO_DIR = Path(__file__).resolve().parent.parent / "khmer-mastery" / "public" / "sounds"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

if not url or not key:
    print(f"❌ ОШИБКА: Нет ключей Supabase в {env_path.absolute()}")
    sys.exit(1)

supabase: Client = create_client(url, key)


# --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

def get_item_type(khmer_text, english_text):
    """Определяет тип элемента для словаря (слово, фраза, число)"""
    clean = khmer_text.split(' (')[0].strip()
    if '?' in clean or clean.count(' ') >= 2: return 'sentence'
    if any(char.isdigit() for char in english_text): return 'number'
    if clean in ["សួស្តី", "ជំរាបសួរ", "អរគុណ", "បាទ", "ចាស"]: return 'phrase'
    return 'word'


def resolve_khmer_english(item_type, data):
    if item_type == "vocab_card":
        front = data.get("front", "") or ""
        back = data.get("back", "") or ""
        front_has_khmer = KHMER_PATTERN.search(front)
        back_has_khmer = KHMER_PATTERN.search(back)
        if front_has_khmer and not back_has_khmer:
            return front, back
        if back_has_khmer and not front_has_khmer:
            return back, front
        if back:
            return back, front
        return front, back
    if item_type == "quiz":
        return data.get("correct_answer", "") or "", "Quiz Answer"
    return "", ""


async def generate_audio(text, filename):
    """Генерирует MP3 через Edge-TTS, если файла еще нет"""
    filepath = AUDIO_DIR / filename
    if filepath.exists(): return
    try:
        await edge_tts.Communicate(text, VOICE, rate=SPEED).save(filepath)
        print(f"   ✅ Audio created: {filename}")
    except Exception:
        pass  # Тихо пропускаем ошибки генерации


# --- ОСНОВНЫЕ ФУНКЦИИ ---

async def seed_lesson(lesson_id, title, desc, content_list, module_id=None, order_index=0):
    """
    Заливает или ПЕРЕЗАПИСЫВАЕТ урок в базу с безопасной генерацией имен аудиофайлов.
    """
    print(f"🚀 Processing Lesson {lesson_id}: {title}...")

    # 1. UPSERT УРОКА
    lesson_data = {
        "id": lesson_id,
        "title": title,
        "description": desc,
        "module_id": module_id,
        "order_index": order_index
    }

    try:
        supabase.table("lessons").upsert(lesson_data, on_conflict="id").execute()
    except Exception as e:
        print(f"   ❌ Ошибка записи в таблицу lessons: {e}")
        return

    # 2. ПОЛНАЯ ЧИСТКА СТАРЫХ КАРТОЧЕК
    try:
        existing = supabase.table("lesson_items").select("id").eq("lesson_id", lesson_id).execute()
        ids = [i['id'] for i in existing.data]

        if ids:
            try:
                supabase.table("user_srs").delete().in_("item_id", ids).execute()
            except:
                pass
            try:
                supabase.table("user_srs_items").delete().in_("item_id", ids).execute()
            except:
                pass

        supabase.table("lesson_items").delete().eq("lesson_id", lesson_id).execute()
        print(f"   🧹 Old items cleared for lesson {lesson_id}")
    except Exception as e:
        print(f"   ⚠️ Cleanup warning: {e}")

    # 3. ВСТАВКА НОВОГО КОНТЕНТА
    for idx, item in enumerate(content_list):
        # А) ОБРАБОТКА КВИЗОВ (Все варианты ответов)
        if item['type'] == 'quiz':
            options = item['data'].get('options', [])
            item['data']['options_metadata'] = {}

            for opt in options:
                clean_opt = opt.split(' (')[0].replace('?', '').strip()
                if not clean_opt: continue

                # Ищем перевод и транскрипцию в словаре для ИМЕНИ файла
                opt_eng_label = "option"
                opt_pronunciation = ""
                try:
                    dict_res = supabase.table("dictionary").select("pronunciation", "english").eq("khmer",
                                                                                                  clean_opt).limit(
                        1).execute()
                    if dict_res.data:
                        opt_pronunciation = dict_res.data[0].get("pronunciation", "")
                        opt_eng_label = dict_res.data[0].get("english", "option")
                except:
                    pass

                # Генерация БЕЗОПАСНОГО имени файла: english_label + hash
                safe_label = re.sub(r'[\\/*?:"<>|]', "", opt_eng_label).lower().strip().replace(' ', '_')[:15]
                w_hash = hashlib.md5(clean_opt.encode()).hexdigest()[:4]
                opt_audio_name = f"opt_{safe_label}_{w_hash}.mp3"

                await generate_audio(clean_opt, opt_audio_name)

                item['data']['options_metadata'][opt] = {
                    "audio": opt_audio_name,
                    "pronunciation": opt_pronunciation
                }

        # Б) СТАНДАРТНАЯ ОБРАБОТКА (Vocab и основной ответ квиза)
        if item['type'] in ['vocab_card', 'quiz']:
            khmer, english = resolve_khmer_english(item['type'], item['data'])
            if item['type'] == 'quiz':
                khmer = item['data'].get('correct_answer', '')

            if khmer:
                clean_khmer = khmer.split(' (')[0].replace('?', '').strip()

                # Обновляем произношение из словаря
                try:
                    existing_dict = supabase.table("dictionary").select("pronunciation", "english").eq("khmer",
                                                                                                       clean_khmer).limit(
                        1).execute()
                    if existing_dict.data:
                        item['data']['pronunciation'] = existing_dict.data[0].get("pronunciation", "")
                        if not english: english = existing_dict.data[0].get("english")
                except:
                    pass

                # Генерация имени основного аудио
                safe_eng = re.sub(r'[\\/*?:"<>|]', "", (english or "word")).lower().strip().replace(' ', '_')[:20]
                w_hash = hashlib.md5(clean_khmer.encode()).hexdigest()[:4]
                audio_name = f"{safe_eng}_{w_hash}.mp3"

                await generate_audio(clean_khmer, audio_name)
                item['data']['audio'] = audio_name

                # Upsert в словарь
                dict_entry = {
                    "khmer": clean_khmer,
                    "english": english or "Quiz Answer",
                    "item_type": get_item_type(clean_khmer, english or ""),
                    "pronunciation": item['data'].get('pronunciation', '')
                }
                supabase.table("dictionary").upsert(dict_entry, on_conflict="khmer").execute()

        # Запись в базу
        try:
            supabase.table("lesson_items").insert({
                "lesson_id": lesson_id,
                "type": item['type'],
                "order_index": idx,
                "data": item['data']
            }).execute()
        except Exception as e:
            print(f"   ❌ Error inserting item {idx}: {e}")

    print(f"🎉 Lesson {lesson_id} synced! Audio files now use safe English names.")


async def update_study_materials(module_id, lessons_data):
    """
    Собирает контент всех уроков и обновляет 'Книжечку' (study_materials) для главы.
    """
    print(f"\n📘 Updating Study Materials (Guidebook) for Module {module_id}...")

    summary_text = f"# Chapter Summary\n\n"

    for lesson_id, info in lessons_data.items():
        summary_text += f"## {info['title']}\n"

        # 1. Сначала правила (Theory)
        theory_found = False
        for item in info['content']:
            if item['type'] == 'theory':
                summary_text += f"* 💡 **{item['data']['title']}**: {item['data']['text']}\n"
                theory_found = True
        if theory_found: summary_text += "\n"

        # 2. Потом слова (Vocab)
        for item in info['content']:
            if item['type'] == 'vocab_card':
                khmer = item['data'].get('back', '')
                eng = item['data'].get('front', '')
                pron = item['data'].get('pronunciation', '')
                summary_text += f"* **{khmer}** ({pron}) — {eng}\n"

        summary_text += "\n"

    # Записываем в таблицу study_materials
    try:
        supabase.table("study_materials").upsert({
            "chapter_id": module_id,
            "title": f"Summary: Module {module_id}",
            "content": summary_text,
            "type": "summary"
        }, on_conflict="chapter_id").execute()
        print(f"✅ Study materials for Module {module_id} updated successfully!")
    except Exception as e:
        print(f"⚠️ Failed to update study_materials: {e}")