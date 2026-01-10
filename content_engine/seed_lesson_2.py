import asyncio
import os
import edge_tts
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# --- НАСТРОЙКИ ---
LESSON_ID = 2
LESSON_TITLE = "Lesson 2: I Want... (Essential Needs)"
VOICE = "km-KH-PisethNeural"
SPEED = "-15%"

load_dotenv()
supabase: Client = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
AUDIO_DIR = Path(__file__).resolve().parent.parent / "khmer-mastery" / "public" / "sounds"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# === УНИВЕРСАЛЬНЫЙ КОНТЕНТ УРОВНЯ B1-B2 ===
CONTENT = [
    {
        "type": "theory",
        "data": {
            "title": "Grammar: Jong vs Jong Ban",
            "text": "В кхмерском языке два способа сказать 'хочу':\n1. Jong (ចង់) — используется перед глаголом (хочу есть, хочу пойти).\n2. Jong Ban (ចង់បាន) — используется перед существительным (хочу воду, хочу телефон)."
        }
    },
    {"type": "vocab_card",
     "data": {"front": "I want (to do something)", "back": "ចង់", "pronunciation": "Knyom jong...",
              "audio": "jong.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "I want (to get/have)", "back": "ចង់បាន", "pronunciation": "Knyom jong ban...",
              "audio": "jong_ban.mp3"}},
    {"type": "vocab_card", "data": {"front": "Water", "back": "ទឹក", "pronunciation": "Tuk", "audio": "water.mp3"}},
    {"type": "vocab_card", "data": {"front": "To eat", "back": "ញ៉ាំ", "pronunciation": "Nyam", "audio": "nyam.mp3"}},
    {"type": "vocab_card", "data": {"front": "Rice", "back": "បាយ", "pronunciation": "Bay", "audio": "rice.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "I want to eat rice", "back": "ខ្ញុំចង់ញ៉ាំបាយ", "pronunciation": "Knyom jong nyam bay",
              "audio": "want_eat_rice.mp3"}},
    {
        "type": "theory",
        "data": {
            "title": "Negation: Ot... te",
            "text": "Чтобы сказать 'не хочу', мы используем конструкцию Ot (អត់) ... te (ទេ). Само действие или предмет ставится посередине."
        }
    },
    {"type": "vocab_card",
     "data": {"front": "I don't want", "back": "អត់ចង់ទេ", "pronunciation": "Ot jong te", "audio": "dont_want.mp3"}},
    {
        "type": "quiz",
        "data": {
            "question": "Как вежливо попросить воду (I want water)?",
            "options": ["ខ្ញុំចង់បានទឹក (Knyom jong ban tuk)", "ខ្ញុំចង់ទឹក (Knyom jong tuk)",
                        "អត់ចង់បានទេ (Ot jong ban te)"],
            "correct_answer": "ខ្ញុំចង់បានទឹក (Knyom jong ban tuk)",
            "explanation": "Правильно! Вода — это существительное, поэтому используем 'Jong Ban'.",
            "audio_map": {"ខ្ញុំចង់បានទឹក (Knyom jong ban tuk)": "i_want_water.mp3"}
        }
    }
]


async def generate_audio(text, filename):
    filepath = AUDIO_DIR / filename
    if not filepath.exists():
        clean_text = text.split('(')[0].strip()
        await edge_tts.Communicate(clean_text, VOICE, rate=SPEED).save(filepath)


async def seed_lesson():
    print(f"🚀 Filling Lesson {LESSON_ID}: {LESSON_TITLE}...")

    items_to_insert = []
    audio_tasks = []
    vocabulary = []

    for idx, item in enumerate(CONTENT):
        db_data = item["data"].copy()

        if item["type"] == "vocab_card":
            vocabulary.append({"khmer": db_data["back"], "english": db_data["front"], "audio": db_data.get("audio")})
            if "audio" in db_data:
                audio_tasks.append(generate_audio(db_data["back"], db_data["audio"]))

        if item["type"] == "quiz" and "audio_map" in db_data:
            for text, file in db_data["audio_map"].items():
                audio_tasks.append(generate_audio(text, file))

        items_to_insert.append({"lesson_id": LESSON_ID, "type": item["type"], "order_index": idx, "data": db_data})

    await asyncio.gather(*audio_tasks)

    # Обновляем структуру урока
    supabase.table("lessons").update({"title": LESSON_TITLE, "vocabulary": vocabulary}).eq("id", LESSON_ID).execute()
    # Очищаем и заливаем айтемы
    supabase.table("lesson_items").delete().eq("lesson_id", LESSON_ID).execute()
    supabase.table("lesson_items").insert(items_to_insert).execute()

    print(f"✅ Lesson {LESSON_ID} successfully seeded with universal B1-B2 foundation!")


if __name__ == "__main__":
    asyncio.run(seed_lesson())