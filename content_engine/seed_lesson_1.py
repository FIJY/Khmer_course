import asyncio
import os
import edge_tts
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# --- НАСТРОЙКИ ---
VOICE = "km-KH-PisethNeural"
SPEED = "-10%"
FORCE_UPDATE_AUDIO = False

load_dotenv()

# Пути для аудио
SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR.parent
AUDIO_OUTPUT_DIR = BASE_DIR / "khmer-mastery" / "public" / "sounds"
AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

supabase: Client = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# === ВСЕ ПОДУРОКИ ГЛАВЫ 1 ===
CHAPTER_1_DATA = {
    101: {
        "title": "Lesson 1.1: Greetings & Sampeah",
        "desc": "How to say Hello and show respect in Cambodia.",
        "content": [
            {"type": "theory", "data": {"title": "The Art of Sampeah",
                                        "text": "Khmer culture is hierarchical. When greeting, place your palms together. The higher your hands, the more respect: Peers = Chest, Elders = Nose."}},
            {"type": "vocab_card", "data": {"front": "Hello (General)", "back": "សួស្តី", "pronunciation": "Sues-dey",
                                            "audio": "hello_informal.mp3"}},
            {"type": "vocab_card",
             "data": {"front": "Hello (Formal)", "back": "ជំរាបសួរ", "pronunciation": "Choum Reap Sour",
                      "audio": "hello_formal.mp3"}},
            {
                "type": "quiz",
                "data": {
                    "question": "You meet a monk. Which greeting is correct?",
                    "options": ["ជំរាបសួរ (Choum Reap Sour)", "សួស្តី (Sues-dey)", "បាទ (Baat)"],
                    "correct_answer": "ជំរាបសួរ (Choum Reap Sour)",
                    "audio_map": {"ជំរាបសួរ (Choum Reap Sour)": "hello_formal.mp3",
                                  "សួស្តី (Sues-dey)": "hello_informal.mp3"}
                }
            }
        ]
    },
    102: {
        "title": "Lesson 1.2: Politeness & Gender",
        "desc": "Mastering 'Baat', 'Jaa' and essential manners.",
        "content": [
            {"type": "theory", "data": {"title": "Gendered Particles",
                                        "text": "Politeness is key. Men end sentences with 'Baat', women with 'Jaa'. These also mean 'Yes'."}},
            {"type": "vocab_card",
             "data": {"front": "Yes (Male)", "back": "បាទ", "pronunciation": "Baat", "audio": "yes_male.mp3"}},
            {"type": "vocab_card",
             "data": {"front": "Yes (Female)", "back": "ចាស", "pronunciation": "Jaa", "audio": "yes_female.mp3"}},
            {"type": "vocab_card",
             "data": {"front": "Thank you", "back": "អរគុណ", "pronunciation": "Akun", "audio": "thanks.mp3"}},
            {
                "type": "quiz",
                "data": {
                    "question": "If you are a woman, how do you say 'Yes'?",
                    "options": ["ចាស (Jaa)", "បាទ (Baat)", "ទេ (Ot-te)"],
                    "correct_answer": "ចាស (Jaa)",
                    "audio_map": {"ចាស (Jaa)": "yes_female.mp3", "បាទ (Baat)": "yes_male.mp3"}
                }
            }
        ]
    }
}


async def generate_audio(text, filename):
    filepath = AUDIO_OUTPUT_DIR / filename
    if filepath.exists() and not FORCE_UPDATE_AUDIO: return
    clean_text = "".join([c for c in text.split('(')[0] if ord(c) > 128 or c.isspace()]).strip()
    if not clean_text: return
    try:
        await edge_tts.Communicate(clean_text, VOICE, rate=SPEED).save(filepath)
        print(f"   ✅ Audio: {filename}")
    except Exception as e:
        print(f"   ❌ Error {filename}: {e}")


async def seed_chapter():
    for l_id, info in CHAPTER_1_DATA.items():
        print(f"🚀 Seeding {info['title']} (ID: {l_id})...")

        # 1. Upsert урока
        supabase.table("lessons").upsert({"id": l_id, "title": info["title"], "description": info["desc"]}).execute()

        # 2. Подготовка словаря
        vocab = [
            {"khmer": i["data"]["back"], "english": i["data"]["front"], "pronunciation": i["data"]["pronunciation"],
             "audio": i["data"].get("audio")}
            for i in info["content"] if i["type"] == "vocab_card"]
        supabase.table("lessons").update({"vocabulary": vocab}).eq("id", l_id).execute()

        # 3. Очистка и вставка элементов
        supabase.table("lesson_items").delete().eq("lesson_id", l_id).execute()

        audio_tasks = {}
        items_to_insert = []
        for idx, item in enumerate(info["content"]):
            if "audio" in item["data"]:
                audio_tasks[item["data"]["audio"]] = generate_audio(item["data"]["back"], item["data"]["audio"])
            if item["type"] == "quiz" and "audio_map" in item["data"]:
                for t_key, f_name in item["data"]["audio_map"].items():
                    audio_tasks[f_name] = generate_audio(t_key, f_name)

            items_to_insert.append({"lesson_id": l_id, "type": item["type"], "order_index": idx, "data": item["data"]})

        await asyncio.gather(*audio_tasks.values())
        supabase.table("lesson_items").insert(items_to_insert).execute()
        print(f"   🎉 {info['title']} updated!\n")


if __name__ == "__main__":
    asyncio.run(seed_chapter())