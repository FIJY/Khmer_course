import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# БАЗА ЗНАНИЙ О ДИАКРИТИКАХ
# Мы убираем audio_url (ставим None) и добавляем описание того, что знак ДЕЛАЕТ.
DIACRITIC_RULES = [
    # --- ИЗМЕНЕНИЯ ЗВУКА ---
    {
        "id": "់", "en": "Bantoc",
        "desc": "Shortener. Makes the vowel sound short and clipped.",
        "audio": None
    },
    {
        "id": "៉", "en": "Musakatoan (Teeth)",
        "desc": "Series Shifter. Converts a 'Deep' (O-Series) consonant into a 'Light' (A-Series) sound.",
        "audio": None
    },
    {
        "id": "៊", "en": "Treisap (Waves)",
        "desc": "Series Shifter. Converts a 'Light' (A-Series) consonant into a 'Deep' (O-Series) sound.",
        "audio": None
    },
    {
        "id": "៍", "en": "Tantakheat (Silencer)",
        "desc": "Mute Button. The letter under this sign is NOT pronounced. Often used in loanwords.",
        "audio": None
    },
    {
        "id": "័", "en": "Samyok Sann",
        "desc": "Vowel Changer. Usually acts like a short 'a' sound in Sanskrit/Pali words.",
        "audio": None
    },

    # --- ДОБАВЛЕНИЕ ЗВУКОВ ---
    {
        "id": "ំ", "en": "Nikahit",
        "desc": "Nasalizer. Adds an 'm' sound to the end of the syllable (Am/Om).",
        "audio": None  # Можно оставить null, или сгенерировать звук "Ммм" позже, если захочешь
    },
    {
        "id": "ះ", "en": "Reahmuk",
        "desc": "Aspirator. Adds a breathy 'h' sound at the end (Ah/Oh).",
        "audio": None
    },

    # --- СТРУКТУРНЫЕ ---
    {
        "id": "្", "en": "Coeng (Subscript)",
        "desc": "Subscript Maker. Kills the vowel of the consonant and prepares the NEXT consonant to be written underneath.",
        "audio": None
    },
    {
        "id": "ៗ", "en": "Lek To",
        "desc": "Duplicator. Repeats the previous word or phrase (for emphasis or plural).",
        "audio": None
    },
    {
        "id": "។", "en": "Khan",
        "desc": "Full Stop. Used to mark the end of a sentence.",
        "audio": None
    }
]


async def update_rules():
    print("🧠 Обновляю правила диакритических знаков...")

    rows = []
    for item in DIACRITIC_RULES:
        rows.append({
            "id": item["id"],
            "description": item["desc"],
            "audio_url": None  # Удаляем ссылку на аудио, чтобы плеер молчал
        })

    try:
        # Обновляем только указанные поля
        for row in rows:
            supabase.table('alphabet').update(row).eq('id', row['id']).execute()
            print(f"✅ Обновлено: {row['id']} -> {row['description']}")

    except Exception as e:
        print(f"❌ Ошибка: {e}")


if __name__ == "__main__":
    asyncio.run(update_rules())