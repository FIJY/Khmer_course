import asyncio
import os
import edge_tts
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Настройки аудио
VOICE = "km-KH-PisethNeural"
SPEED = "-10%"
AUDIO_DIR = Path("C:/Projects/KhmerCourse/khmer-mastery/public/sounds")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

supabase = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))


def get_item_type(khmer_text, english_text):
    """Определяет категорию для честного счета B1 в профиле"""
    clean = khmer_text.split(' (')[0].strip()
    if '?' in clean or clean.count(' ') >= 2: return 'sentence'
    if any(char.isdigit() for char in english_text): return 'number'
    if clean in ["សួស្តី", "ជំរាបសួរ", "អរគុណ"]: return 'phrase'
    return 'word'


async def generate_audio(text, filename):
    filepath = AUDIO_DIR / filename
    if filepath.exists(): return
    clean_text = text.split(' (')[0].strip()
    try:
        await edge_tts.Communicate(clean_text, VOICE, rate=SPEED).save(filepath)
        print(f"   ✅ Audio created: {filename}")
    except Exception as e:
        print(f"   ❌ Audio Error: {e}")


async def seed_lesson(lesson_id, title, desc, content_list):
    """Универсальный загрузчик любого урока"""
    print(f"🚀 Processing Lesson {lesson_id}: {title}...")

    # 1. Upsert самого урока в таблицу lessons
    supabase.table("lessons").upsert({"id": lesson_id, "title": title, "description": desc}).execute()

    # 2. Очищаем старые элементы этого урока, чтобы не дублировать
    supabase.table("lesson_items").delete().eq("lesson_id", lesson_id).execute()

    for idx, item in enumerate(content_list):
        if item['type'] in ['vocab_card', 'quiz']:
            khmer = item['data'].get('back') or item['data'].get('correct_answer')
            english = item['data'].get('front') or "Quiz Answer"

            clean_khmer = khmer.split(' (')[0].strip()
            item_type = get_item_type(clean_khmer, english)
            audio_name = f"{clean_khmer.replace(' ', '_')}.mp3"

            # Генерируем звук, если его нет
            await generate_audio(clean_khmer, audio_name)

            # Сохраняем в Master Dictionary для профиля
            dict_entry = {
                "khmer": clean_khmer,
                "english": english,
                "pronunciation": item['data'].get('pronunciation', ''),
                "item_type": item_type
            }
            res = supabase.table("dictionary").upsert(dict_entry, on_conflict="khmer").execute()

            # Привязываем ID из словаря к данным урока
            item['data']['dictionary_id'] = res.data[0]['id']
            item['data']['audio'] = audio_name

        # Сохраняем элемент урока
        supabase.table("lesson_items").insert({
            "lesson_id": lesson_id,
            "type": item['type'],
            "order_index": idx,
            "data": item['data']
        }).execute()

    print(f"🎉 Lesson {lesson_id} fully synced!\n")