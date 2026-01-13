import os
import sys
import re
from supabase import create_client, Client
from dotenv import load_dotenv
import edge_tts
from pathlib import Path

# 1. Загрузка переменных
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Приоритет Service Role для удаления
if not key:
    key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

VOICE = "km-KH-PisethNeural"
SPEED = "-10%"
AUDIO_DIR = Path(__file__).resolve().parent.parent / "khmer-mastery" / "public" / "sounds"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

if not url or not key:
    print(f"❌ ОШИБКА: Нет ключей в {env_path.absolute()}")
    sys.exit(1)

supabase: Client = create_client(url, key)


def get_item_type(khmer_text, english_text):
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
    except Exception:
        pass  # Тихо пропускаем ошибки аудио


async def seed_lesson(lesson_id, title, desc, content_list):
    print(f"🚀 Processing Lesson {lesson_id}: {title}...")

    # 1. Обновляем заголовок
    supabase.table("lessons").upsert({"id": lesson_id, "title": title, "description": desc}).execute()

    # 2. ЧИСТКА (Исправление ошибки Foreign Key)
    try:
        # Получаем ID старых карточек
        existing = supabase.table("lesson_items").select("id").eq("lesson_id", lesson_id).execute()
        ids = [i['id'] for i in existing.data]

        if ids:
            # УДАЛЯЕМ ИЗ ВСЕХ ВОЗМОЖНЫХ ТАБЛИЦ СТАТИСТИКИ
            # Пробуем user_srs (как в ошибке)
            try:
                supabase.table("user_srs").delete().in_("item_id", ids).execute()
            except:
                pass
                # Пробуем user_srs_items (альтернативное название)
            try:
                supabase.table("user_srs_items").delete().in_("item_id", ids).execute()
            except:
                pass

        # Теперь удаляем сами карточки
        supabase.table("lesson_items").delete().eq("lesson_id", lesson_id).execute()
    except Exception as e:
        print(f"   ⚠️ Cleanup Warning: {e}")

    # 3. ЗАГРУЗКА
    for idx, item in enumerate(content_list):
        # Аудио и Словарь
        if item['type'] in ['vocab_card', 'quiz']:
            khmer = item['data'].get('back') or item['data'].get('correct_answer')
            english = item['data'].get('front') or "Quiz Answer"
            clean_khmer = khmer.split(' (')[0].replace('?', '').strip()

            safe_english = re.sub(r'[\\/*?:"<>|]', "", english).lower().strip().replace(' ', '_')
            audio_name = f"{safe_english}.mp3"

            await generate_audio(clean_khmer, audio_name)

            dict_entry = {
                "khmer": clean_khmer, "english": english,
                "pronunciation": item['data'].get('pronunciation', ''),
                "item_type": get_item_type(clean_khmer, english)
            }
            res = supabase.table("dictionary").upsert(dict_entry, on_conflict="khmer").execute()
            if res.data: item['data']['dictionary_id'] = res.data[0]['id']
            item['data']['audio'] = audio_name

        # Вставка
        try:
            supabase.table("lesson_items").insert({
                "lesson_id": lesson_id,
                "type": item['type'],  # Теперь здесь будет 'theory' вместо 'guidebook'
                "order_index": idx,
                "data": item['data']
            }).execute()
        except Exception as e:
            print(f"   ❌ Error inserting item {idx}: {e}")

    print(f"🎉 Lesson {lesson_id} synced!")