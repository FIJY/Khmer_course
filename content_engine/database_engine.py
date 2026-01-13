import os
import sys
import re
from supabase import create_client, Client
from dotenv import load_dotenv
import edge_tts
from pathlib import Path

# --- НАСТРОЙКИ ---
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Приоритет Service Role
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


async def generate_audio(text, filename):
    filepath = AUDIO_DIR / filename
    if filepath.exists(): return
    try:
        await edge_tts.Communicate(text, VOICE, rate=SPEED).save(filepath)
        print(f"   ✅ Audio: {filename}")
    except Exception:
        pass


def get_item_type(khmer, eng):
    clean = khmer.split(' (')[0].strip()
    if '?' in clean or clean.count(' ') >= 2: return 'sentence'
    if any(char.isdigit() for char in eng): return 'number'
    return 'word'


async def seed_lesson(lesson_id, title, desc, content_list):
    print(f"🚀 Processing Lesson {lesson_id}: {title}...")

    # 1. Upsert Lesson
    supabase.table("lessons").upsert({"id": lesson_id, "title": title, "description": desc}).execute()

    # 2. Cleanup (Fix Foreign Keys)
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
    except Exception as e:
        print(f"   ⚠️ Cleanup warn: {e}")

    # 3. Insert Items
    for idx, item in enumerate(content_list):
        if item['type'] in ['vocab_card', 'quiz']:
            khmer = item['data'].get('back') or item['data'].get('correct_answer')
            eng = item['data'].get('front') or "Quiz Answer"
            clean_khmer = khmer.split(' (')[0].replace('?', '').strip()
            safe_eng = re.sub(r'[\\/*?:"<>|]', "", eng).lower().strip().replace(' ', '_')
            audio = f"{safe_eng}.mp3"

            await generate_audio(clean_khmer, audio)

            # Словарь
            dict_res = supabase.table("dictionary").upsert({
                "khmer": clean_khmer, "english": eng,
                "pronunciation": item['data'].get('pronunciation', ''),
                "item_type": get_item_type(clean_khmer, eng)
            }, on_conflict="khmer").execute()

            if dict_res.data: item['data']['dictionary_id'] = dict_res.data[0]['id']
            item['data']['audio'] = audio

        try:
            supabase.table("lesson_items").insert({
                "lesson_id": lesson_id,
                "type": item['type'],
                "order_index": idx,
                "data": item['data']
            }).execute()
        except Exception as e:
            print(f"   ❌ Insert error: {e}")

    print(f"🎉 Lesson {lesson_id} synced!")