import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
import edge_tts

# 1. Загружаем переменные окружения (.env)
load_dotenv()

# 2. Инициализируем клиент Supabase ПЕРЕД функциями
url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

# Настройки аудио
VOICE = "km-KH-PisethNeural"
SPEED = "-10%"
AUDIO_DIR = Path("C:/Projects/KhmerCourse/khmer-mastery/public/sounds")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


def get_item_type(khmer_text, english_text):
    """Определяет категорию для честного счета B1"""
    clean = khmer_text.split(' (')[0].strip()
    if '?' in clean or clean.count(' ') >= 2: return 'sentence'
    if any(char.isdigit() for char in english_text): return 'number'
    if clean in ["សួស្តី", "ជំរាបសួរ", "អរគុណ"]: return 'phrase'
    return 'word'


async def generate_audio(text, filename):
    filepath = AUDIO_DIR / filename
    if filepath.exists(): return
    try:
        await edge_tts.Communicate(text, VOICE, rate=SPEED).save(filepath)
        print(f"   ✅ Audio: {filename}")
    except Exception as e:
        print(f"   ❌ Audio Error: {e}")


async def seed_lesson(lesson_id, title, desc, content_list):
    print(f"🚀 Processing Lesson {lesson_id}: {title}...")
    supabase.table("lessons").upsert({"id": lesson_id, "title": title, "description": desc}).execute()
    supabase.table("lesson_items").delete().eq("lesson_id", lesson_id).execute()

    for idx, item in enumerate(content_list):
        if item['type'] in ['vocab_card', 'quiz']:
            khmer = item['data'].get('back') or item['data'].get('correct_answer')
            english = item['data'].get('front') or "Quiz Answer"

            # Безопасное имя файла (на английском), чтобы звук не пропадал
            clean_name = english.lower().replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_')
            audio_name = f"{clean_name}.mp3"

            await generate_audio(khmer, audio_name)

            dict_entry = {
                "khmer": khmer.split(' (')[0].strip(),
                "english": english,
                "pronunciation": item['data'].get('pronunciation', ''),
                "item_type": get_item_type(khmer, english)
            }
            # Получаем новый UUID из словаря
            res = supabase.table("dictionary").upsert(dict_entry, on_conflict="khmer").execute()

            # ВАЖНО: сохраняем всё в data, чтобы карточки не пустели
            item['data']['dictionary_id'] = res.data[0]['id']
            item['data']['audio'] = audio_name

        supabase.table("lesson_items").insert({
            "lesson_id": lesson_id, "type": item['type'], "order_index": idx, "data": item['data']
        }).execute()