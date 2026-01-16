import os
import sys
import re
import asyncio
import hashlib
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

def get_safe_audio_name(khmer_text, english_label=None):
    """Генерирует красивое имя файла: english_hash.mp3"""
    clean_k = khmer_text.split(' (')[0].replace('?', '').strip()
    # Если перевода нет, используем 'audio', если есть - чистим его для имени файла
    label = english_label or "audio"
    safe_label = re.sub(r'[\\/*?:"<>|]', "", label).lower().strip().replace(' ', '_')[:15]

    # Хэш от кхмерского гарантирует, что одно слово = один файл
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
    supabase.table("lessons").upsert({
        "id": lesson_id, "title": title, "description": desc,
        "module_id": module_id, "order_index": order_index
    }, on_conflict="id").execute()

    # 2. ЧИСТКА СТАРЫХ ДАННЫХ
    existing = supabase.table("lesson_items").select("id").eq("lesson_id", lesson_id).execute()
    ids = [i['id'] for i in existing.data]
    if ids:
        for table in ["user_srs", "user_srs_items"]:
            try:
                supabase.table(table).delete().in_("item_id", ids).execute()
            except:
                pass
        supabase.table("lesson_items").delete().eq("lesson_id", lesson_id).execute()

    # 3. ВСТАВКА КОНТЕНТА
    for idx, item in enumerate(content_list):
        # А) ОБРАБОТКА КВИЗОВ
        if item['type'] == 'quiz':
            options = item['data'].get('options', [])
            item['data']['options_metadata'] = {}
            for opt in options:
                clean_opt = opt.split(' (')[0].replace('?', '').strip()
                # Ищем данные в словаре для красоты
                dict_res = supabase.table("dictionary").select("pronunciation", "english").eq("khmer",
                                                                                              clean_opt).execute()
                entry = dict_res.data[0] if dict_res.data else {}

                pron = entry.get("pronunciation", "")
                eng = entry.get("english", "option")

                audio_name = get_safe_audio_name(clean_opt, eng)
                await generate_audio(clean_opt, audio_name)

                # Записываем метаданные варианта
                item['data']['options_metadata'][opt] = {
                    "audio": audio_name,
                    "pronunciation": pron
                }

        # Б) ОБРАБОТКА VOCAB И КАРТОЧЕК
        if item['type'] in ['vocab_card', 'quiz']:
            khmer, english = resolve_khmer_english(item['type'], item['data'])
            if khmer:
                clean_k = khmer.split(' (')[0].replace('?', '').strip()
                # Ищем транскрипцию в словаре
                dict_res = supabase.table("dictionary").select("pronunciation", "english").eq("khmer",
                                                                                              clean_k).execute()
                entry = dict_res.data[0] if dict_res.data else {}

                # Принудительно обновляем транскрипцию в данных урока
                item['data']['pronunciation'] = entry.get("pronunciation", item['data'].get("pronunciation", ""))
                english = entry.get("english", english)

                audio_name = get_safe_audio_name(clean_k, english)
                await generate_audio(clean_k, audio_name)
                item['data']['audio'] = audio_name

                # Обновляем сам словарь
                supabase.table("dictionary").upsert({
                    "khmer": clean_k, "english": english,
                    "pronunciation": item['data']['pronunciation'],
                    "item_type": get_item_type(clean_k, english)
                }, on_conflict="khmer").execute()

        # Запись карточки
        supabase.table("lesson_items").insert({
            "lesson_id": lesson_id, "type": item['type'],
            "order_index": idx, "data": item['data']
        }).execute()

    print(f"🎉 Lesson {lesson_id} synced with clean filenames and transcriptions!")


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