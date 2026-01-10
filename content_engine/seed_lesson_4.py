import asyncio
import os
import edge_tts
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# --- SETTINGS ---
LESSON_ID = 4
LESSON_TITLE = "Lesson 4: Survival Requests & Navigation"
VOICE = "km-KH-PisethNeural"
SPEED = "-15%"

load_dotenv()
supabase: Client = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
AUDIO_DIR = Path(__file__).resolve().parent.parent / "khmer-mastery" / "public" / "sounds"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

CONTENT = [
    # STEP 1: POLITE REQUESTS (SOUM)
    {
        "type": "theory",
        "data": {
            "title": "The Power of 'Soum'",
            "text": "In Khmer, 'Soum' (សូម) means 'Please' or 'To ask for'. Starting your requests with 'Soum' immediately makes you sound more polite and respectful."
        }
    },
    {"type": "vocab_card", "data": {"front": "Please", "back": "សូម", "pronunciation": "Soum", "audio": "please.mp3"}},
    {"type": "vocab_card", "data": {"front": "Help", "back": "ជួយ", "pronunciation": "Chuoy", "audio": "help.mp3"}},
    {"type": "vocab_card", "data": {"front": "Please help (me)", "back": "សូមជួយខ្ញុំ", "pronunciation": "Soum chuoy knyom", "audio": "please_help.mp3"}},

    # STEP 2: TUK-TUK NAVIGATION
    {
        "type": "theory",
        "data": {
            "title": "Directing Your Driver",
            "text": "When you are in a Tuk-tuk, you need to be precise. Use these three core commands."
        }
    },
    {"type": "vocab_card", "data": {"front": "Stop", "back": "ឈប់", "pronunciation": "Chhoup", "audio": "stop.mp3"}},
    {"type": "vocab_card", "data": {"front": "Turn left", "back": "បត់ឆ្វេង", "pronunciation": "Bot chveng", "audio": "turn_left.mp3"}},
    {"type": "vocab_card", "data": {"front": "Turn right", "back": "បត់ស្តាំ", "pronunciation": "Bot sdam", "audio": "turn_right.mp3"}},
    {"type": "vocab_card", "data": {"front": "Go straight", "back": "ទៅត្រង់", "pronunciation": "Tov trang", "audio": "go_straight.mp3"}},
    {"type": "vocab_card", "data": {"front": "Please stop here", "back": "សូមឈប់ទីនេះ", "pronunciation": "Soum chhoup ti-nih", "audio": "stop_here.mp3"}},

    # STEP 3: ASKING "WHERE IS...?"
    {
        "type": "theory",
        "data": {
            "title": "Finding Your Way",
            "text": "To ask where something is, use: [Noun] + 'Nov ae-na?' (នៅឯណា?)."
        }
    },
    {"type": "vocab_card", "data": {"front": "Where is...?", "back": "នៅឯណា?", "pronunciation": "... nov ae-na?", "audio": "where_is.mp3"}},
    {"type": "vocab_card", "data": {"front": "Toilet / Bathroom", "back": "បង្គន់", "pronunciation": "Bong-kun", "audio": "toilet.mp3"}},
    {"type": "vocab_card", "data": {"front": "Hotel", "back": "សណ្ឋាគារ", "pronunciation": "Sonn-tha-kea", "audio": "hotel.mp3"}},
    {"type": "vocab_card", "data": {"front": "Where is the toilet?", "back": "បង្គន់នៅឯណា?", "pronunciation": "Bong-kun nov ae-na?", "audio": "where_is_toilet.mp3"}},

    # STEP 4: EMERGENCY
    {"type": "vocab_card", "data": {"front": "Wait a minute", "back": "ចាំមួយភ្លែត", "pronunciation": "Cham mouy phlet", "audio": "wait_minute.mp3"}},
    {"type": "vocab_card", "data": {"front": "I'm lost", "back": "ខ្ញុំវង្វេងផ្លូវ", "pronunciation": "Knyom vong-veng plov", "audio": "i_am_lost.mp3"}},

    # QUIZZES
    {
        "type": "quiz",
        "data": {
            "question": "You want to tell the driver to stop right here. What is the most polite way?",
            "options": ["សូមឈប់ទីនេះ (Soum chhoup ti-nih)", "ឈប់ (Chhoup)", "បត់ឆ្វេង (Bot chveng)"],
            "correct_answer": "សូមឈប់ទីនេះ (Soum chhoup ti-nih)",
            "explanation": "Correct! Adding 'Soum' (Please) and 'Ti-nih' (Here) makes it clear and polite.",
            "audio_map": {"សូមឈប់ទីនេះ (Soum chhoup ti-nih)": "stop_here.mp3"}
        }
    },
    {
        "type": "quiz",
        "data": {
            "question": "How do you ask 'Where is the hotel?'",
            "options": ["សណ្ឋាគារនៅឯណា? (Sonn-tha-kea nov ae-na?)", "សូមជួយខ្ញុំ (Soum chuoy knyom)", "ទៅត្រង់ (Tov trang)"],
            "correct_answer": "សណ្ឋាគារនៅឯណា? (Sonn-tha-kea nov ae-na?)",
            "explanation": "Perfect. Place the noun 'Hotel' before 'Nov ae-na?'.",
            "audio_map": {"សណ្ឋាគារនៅឯណា? (Sonn-tha-kea nov ae-na?)": "where_is_hotel.mp3"}
        }
    }
]

async def generate_audio(text, filename):
    filepath = AUDIO_DIR / filename
    if not filepath.exists():
        clean_text = text.split('(')[0].strip()
        await edge_tts.Communicate(clean_text, VOICE, rate=SPEED).save(filepath)

async def seed_lesson():
    print(f"🚀 Filling Lesson {LESSON_ID} (English Version)...")
    items_to_insert = []
    audio_tasks = []
    vocabulary = []

    for idx, item in enumerate(CONTENT):
        db_data = item["data"].copy()
        if item["type"] == "vocab_card":
            vocabulary.append({"khmer": db_data["back"], "english": db_data["front"], "audio": db_data.get("audio")})
            audio_tasks.append(generate_audio(db_data["back"], db_data.get("audio")))
        if item["type"] == "quiz" and "audio_map" in db_data:
            for text, file in db_data["audio_map"].items():
                audio_tasks.append(generate_audio(text, file))
        items_to_insert.append({"lesson_id": LESSON_ID, "type": item["type"], "order_index": idx, "data": db_data})

    await asyncio.gather(*audio_tasks)
    supabase.table("lessons").update({"title": LESSON_TITLE, "vocabulary": vocabulary}).eq("id", LESSON_ID).execute()
    supabase.table("lesson_items").delete().eq("lesson_id", LESSON_ID).execute()
    supabase.table("lesson_items").insert(items_to_insert).execute()
    print(f"✅ Lesson {LESSON_ID} populated with high-quality English content!")

if __name__ == "__main__":
    asyncio.run(seed_lesson())