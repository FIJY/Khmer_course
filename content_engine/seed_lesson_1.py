import asyncio
import os
import edge_tts
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# --- НАСТРОЙКИ ---
LESSON_TITLE = "Lesson 1: Greetings & Politeness"
VOICE = "km-KH-PisethNeural"
SPEED = "-15%"
FORCE_UPDATE_AUDIO = True

load_dotenv()

# Пути
SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR.parent
AUDIO_OUTPUT_DIR = BASE_DIR / "khmer-mastery" / "public" / "sounds"
AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

supabase: Client = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# === КОНТЕНТ УРОКА (С УВЕЛИЧЕННЫМ КОЛИЧЕСТВОМ ТЕСТОВ) ===
CONTENT = [
    {"type": "theory",
     "data": {"title": "Greetings", "text": "Formal and informal ways to say Hello. Use 'Sampeah' to show respect."}},
    {"type": "vocab_card",
     "data": {"front": "Hello", "back": "សួស្តី", "pronunciation": "Sues-dey", "audio": "hello_informal.mp3"}},
    {"type": "vocab_card", "data": {"front": "Hello (Formal)", "back": "ជំរាបសួរ", "pronunciation": "Choum Reap Sour",
                                    "audio": "hello_formal.mp3"}},

    # Квиз 1: Выбор стиля
    {
        "type": "quiz",
        "data": {
            "question": "You meet a monk or a teacher. How do you say Hello?",
            "options": ["ជំរាបសួរ (Choum Reap Sour)", "សួស្តី (Sues-dey)", "បាទ (Baat)"],
            "correct_answer": "ជំរាបសួរ (Choum Reap Sour)",
            "explanation": "Always use the formal 'Choum Reap Sour' for people of higher status or elders.",
            "audio_map": {
                "ជំរាបសួរ (Choum Reap Sour)": "hello_formal.mp3",
                "សួស្តី (Sues-dey)": "hello_informal.mp3"
            }
        }
    },

    {"type": "vocab_card",
     "data": {"front": "Thank you", "back": "អរគុណ", "pronunciation": "Akun", "audio": "thanks.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "Sorry / Excuse me", "back": "សុំទោស", "pronunciation": "Som-doh", "audio": "sorry.mp3"}},

    # Квиз 2: Благодарность
    {
        "type": "quiz",
        "data": {
            "question": "What is 'Thank you' in Khmer?",
            "options": ["អរគុណ (Akun)", "សុំទោស (Som-doh)", "សូម (Soum)"],
            "correct_answer": "អរគុណ (Akun)",
            "explanation": "Akun is the most essential word to show gratitude.",
            "audio_map": {
                "អរគុណ (Akun)": "thanks.mp3",
                "សុំទោស (Som-doh)": "sorry.mp3"
            }
        }
    },

    {"type": "theory", "data": {"title": "Well-being", "text": "'Sok-sabay' is about health and general life status."}},
    {"type": "vocab_card", "data": {"front": "How are you?", "back": "សុខសប្បាយទេ?", "pronunciation": "Sok-sabay te?",
                                    "audio": "how_are_you.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "I'm fine", "back": "សុខសប្បាយ", "pronunciation": "Sok-sabay", "audio": "im_fine.mp3"}},

    # Квиз 3: Ответ на вопрос "Как дела?"
    {
        "type": "quiz",
        "data": {
            "question": "Someone asks you 'Sok-sabay te?'. What is the correct response?",
            "options": ["សុខសប្បាយ (Sok-sabay)", "អរគុណ (Akun)", "ជំរាបលា (Choum Reap Lea)"],
            "correct_answer": "សុខសប្បាយ (Sok-sabay)",
            "explanation": "To say you are fine, simply repeat 'Sok-sabay'.",
            "audio_map": {
                "សុខសប្បាយ (Sok-sabay)": "im_fine.mp3",
                "អរគុណ (Akun)": "thanks.mp3"
            }
        }
    },

    {"type": "vocab_card",
     "data": {"front": "Fun / Happy", "back": "សប្បាយ", "pronunciation": "Sabay", "audio": "sabay.mp3"}},
    {"type": "vocab_card", "data": {"front": "Please", "back": "សូម", "pronunciation": "Soum", "audio": "please.mp3"}},

    # Квиз 4: Извинение
    {
        "type": "quiz",
        "data": {
            "question": "You want to say 'Excuse me' to pass through. What do you use?",
            "options": ["សុំទោស (Som-doh)", "សូម (Soum)", "ទេ (Ot-te)"],
            "correct_answer": "សុំទោស (Som-doh)",
            "explanation": "'Som-doh' is used for both 'Sorry' and 'Excuse me'.",
            "audio_map": {
                "សុំទោស (Som-doh)": "sorry.mp3",
                "សូម (Soum)": "please.mp3"
            }
        }
    },

    {"type": "theory", "data": {"title": "Politeness", "text": "Gender matters! Men say 'Baat', women say 'Jaa'."}},
    {"type": "vocab_card",
     "data": {"front": "Yes (Male)", "back": "បាទ", "pronunciation": "Baat", "audio": "yes_male.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "Yes (Female)", "back": "ចាស", "pronunciation": "Jaa", "audio": "yes_female.mp3"}},
    {"type": "vocab_card", "data": {"front": "No", "back": "ទេ", "pronunciation": "Ot-te", "audio": "no.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "Goodbye", "back": "ជំរាបលា", "pronunciation": "Choum Reap Lea", "audio": "bye_formal.mp3"}},

    # Квиз 5: Гендерный тест
    {
        "type": "quiz",
        "data": {
            "question": "If you are a woman, how do you say 'Yes'?",
            "options": ["ចាស (Jaa)", "បាទ (Baat)", "ទេ (Ot-te)"],
            "correct_answer": "ចាស (Jaa)",
            "explanation": "Female speakers always use 'Jaa' for politeness.",
            "audio_map": {
                "ចាស (Jaa)": "yes_female.mp3",
                "បាទ (Baat)": "yes_male.mp3"
            }
        }
    }
]


async def generate_single_audio(text, filename):
    filepath = AUDIO_OUTPUT_DIR / filename
    if filepath.exists() and not FORCE_UPDATE_AUDIO: return
    clean_text = "".join([c for c in text.split('(')[0] if ord(c) > 128 or c.isspace()]).strip()
    if not clean_text: return
    try:
        await edge_tts.Communicate(clean_text, VOICE, rate=SPEED).save(filepath)
        print(f"   ✅ Created: {filename}")
    except Exception as e:
        print(f"   ❌ Error {filename}: {e}")


async def seed_lesson():
    print(f"🚀 Processing: {LESSON_TITLE}")

    res = supabase.table("lessons").select("id").eq("title", LESSON_TITLE).execute()

    if res.data:
        lesson_id = res.data[0]['id']
        print(f"✅ Используем урок ID: {lesson_id}")
    else:
        new_l = supabase.table("lessons").insert(
            {"title": LESSON_TITLE, "description": "Greetings and politeness"}).execute()
        lesson_id = new_l.data[0]['id']
        print(f"🆕 Создан новый урок с ID: {lesson_id}")

    vocab = []
    for i in CONTENT:
        if i["type"] == "vocab_card":
            vocab.append({
                "khmer": i["data"]["back"],
                "english": i["data"]["front"],
                "pronunciation": i["data"]["pronunciation"],
                "audio": i["data"].get("audio")
            })
    supabase.table("lessons").update({"vocabulary": vocab}).eq("id", lesson_id).execute()

    supabase.table("lesson_items").delete().eq("lesson_id", lesson_id).execute()

    audio_tasks = []
    items_to_insert = []

    for idx, item in enumerate(CONTENT):
        if "audio" in item["data"]:
            audio_tasks.append(generate_single_audio(item["data"]["back"], item["data"]["audio"]))

        if item["type"] == "quiz" and "audio_map" in item["data"]:
            for text_key, filename in item["data"]["audio_map"].items():
                audio_tasks.append(generate_single_audio(text_key, filename))

        items_to_insert.append({
            "lesson_id": lesson_id,
            "type": item["type"],
            "order_index": idx,
            "data": item["data"]
        })

    await asyncio.gather(*audio_tasks)
    supabase.table("lesson_items").insert(items_to_insert).execute()
    print(f"🚀 Урок успешно обновлен под ID {lesson_id} с большим количеством тестов!")


if __name__ == "__main__":
    asyncio.run(seed_lesson())