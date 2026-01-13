import os
import sys
import re  # Добавили для очистки имен файлов
from supabase import create_client, Client
from dotenv import load_dotenv
import edge_tts
from pathlib import Path

# 1. Загружаем переменные окружения
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

# 2. Умный поиск URL
url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")

# 3. Умный поиск КЛЮЧА
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not key:
    key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

# Настройки аудио
VOICE = "km-KH-PisethNeural"
SPEED = "-10%"
AUDIO_DIR = Path(__file__).resolve().parent.parent / "khmer-mastery" / "public" / "sounds"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# 4. ДИАГНОСТИКА
if not url or not key:
    print("\n❌ ОШИБКА: Не удалось прочитать ключи из .env")
    print(f"   📂 Ищем файл здесь: {env_path.absolute()}")
    sys.exit(1)

try:
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"❌ ОШИБКА подключения к Supabase: {e}")
    sys.exit(1)


def get_item_type(khmer_text, english_text):
    """Определяет категорию"""
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
        print(f"   ✅ Audio created: {filename}")
    except Exception as e:
        print(f"   ❌ Audio Error ({filename}): {e}")


async def seed_lesson(lesson_id, title, desc, content_list):
    """Универсальная функция загрузки"""
    print(f"🚀 Processing Lesson {lesson_id}: {title}...")

    # 1. Обновляем урок (УБРАЛИ is_published, чтобы не было ошибки)
    try:
        supabase.table("lessons").upsert({
            "id": lesson_id,
            "title": title,
            "description": desc
            # "is_published": True  <-- Убрали, так как колонки нет в базе
        }).execute()
    except Exception as e:
        print(f"   ⚠️ Error upserting lesson (Critical): {e}")
        # Если урок не создан, дальше идти нет смысла
        return

        # 2. Получаем ID для очистки SRS (Foreign Key Fix)
    try:
        existing = supabase.table("lesson_items").select("id").eq("lesson_id", lesson_id).execute()
        ids = [i['id'] for i in existing.data]
        if ids:
            supabase.table("user_srs_items").delete().in_("item_id", ids).execute()

        supabase.table("lesson_items").delete().eq("lesson_id", lesson_id).execute()
    except Exception as e:
        print(f"   ⚠️ Cleanup warning: {e}")

    # 3. Загружаем контент
    for idx, item in enumerate(content_list):
        if item['type'] in ['vocab_card', 'quiz']:
            khmer = item['data'].get('back') or item['data'].get('correct_answer')
            english = item['data'].get('front') or "Quiz Answer"

            clean_khmer = khmer.split(' (')[0].replace('?', '').strip()

            # ИСПРАВЛЕНИЕ ИМЕН ФАЙЛОВ: Убираем / \ : * ? " < > |
            safe_english = re.sub(r'[\\/*?:"<>|]', "", english)
            safe_name = safe_english.lower().strip().replace(' ', '_')
            audio_name = f"{safe_name}.mp3"

            await generate_audio(clean_khmer, audio_name)

            # Словарь
            dict_entry = {
                "khmer": clean_khmer,
                "english": english,
                "pronunciation": item['data'].get('pronunciation', ''),
                "item_type": get_item_type(clean_khmer, english)
            }
            res = supabase.table("dictionary").upsert(dict_entry, on_conflict="khmer").execute()

            # Привязываем ID и Аудио
            if res.data:
                item['data']['dictionary_id'] = res.data[0]['id']
            item['data']['audio'] = audio_name

        # Вставка в урок
        try:
            supabase.table("lesson_items").insert({
                "lesson_id": lesson_id,
                "type": item['type'],
                "order_index": idx,
                "data": item['data']
            }).execute()
        except Exception as e:
            print(f"   ❌ Error inserting item {idx}: {e}")

    print(f"🎉 Lesson {lesson_id} synced!")