import asyncio
import os
from pathlib import Path # <--- Добавили это
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Ищем .env в родительской папке (KhmerCourse/.env)
# __file__ - это этот скрипт. parent - папка content_engine. parent.parent - корень.
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 2. Получаем ключи
# Python читает VITE_SUPABASE_URL спокойно, ему префикс не мешает
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(f"❌ Ошибка: Не вижу ключи в файле: {env_path}")
    exit(1)

# Создаем клиент
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- ПЛАН КУРСА (Roadmap to B1) ---
FULL_COURSE = [
    {
        "title": "SURVIVAL",
        "level_label": "Level 1",
        "description": "Speak immediately. No writing.",
        "is_paid": False,
        "lessons": [
            "Politeness Code (Sues-dey)",
            "The Magic Yes & No",
            "Money & Numbers (0-100)",
            "I Want... (Knyom Jong)",
            "Survival Requests (Som/Chhoup)"
        ]
    },
    {
        "title": "DAILY LIFE",
        "level_label": "Level 2",
        "description": "Solve problems without help.",
        "is_paid": True,
        "lessons": [
            "Food Decoder",
            "Market Warrior",
            "Directions & Tuk-tuks",
            "Time Keeper",
            "My House & Rent",
            "Basic Problems",
            "Family & People"
        ]
    },
    {
        "title": "GRAMMAR ENGINE",
        "level_label": "Level 3",
        "description": "Build your own sentences.",
        "is_paid": True,
        "lessons": [
            "Time Machine (Past/Future)",
            "Continuous Action",
            "Negation Mastery",
            "Questions Architect",
            "Logic Connectors"
        ]
    },
    {
        "title": "VISUAL DECODER",
        "level_label": "Level 4",
        "description": "Hack the script. Reading.",
        "is_paid": True,
        "lessons": [
            "Shape Group: Snakes",
            "Shape Group: Houses",
            "Vowels: The Sidekicks",
            "Sub-Consonants (Legs)",
            "Reading Menu"
        ]
    }
]


async def seed_clean():
    print("🧹 Очистка таблиц модулей и уроков...")
    try:
        supabase.table("lesson_items").delete().neq("id", 0).execute()
        supabase.table("lessons").delete().neq("id", 0).execute()
        supabase.table("modules").delete().neq("id", 0).execute()
    except Exception as e:
        print(f"⚠️ Инфо: Таблицы уже чистые или ошибка доступа: {e}")

    print("🚀 Заливка структуры B1...")

    for mod_idx, mod in enumerate(FULL_COURSE):
        # 1. Создаем Модуль
        res_mod = supabase.table("modules").insert({
            "title": mod["title"],
            "level_label": mod["level_label"],
            "description": mod["description"],
            "is_paid": mod["is_paid"],
            "order_index": mod_idx
        }).execute()

        mod_id = res_mod.data[0]['id']
        print(f"📦 [{mod['level_label']}] {mod['title']}")

        # 2. Создаем Уроки
        lessons_data = []
        for less_idx, title in enumerate(mod["lessons"]):
            lessons_data.append({
                "module_id": mod_id,
                "title": title,
                "order_index": less_idx
            })

        if lessons_data:
            supabase.table("lessons").insert(lessons_data).execute()
            print(f"   ✅ Добавлено уроков: {len(lessons_data)}")

    print("\n🎉 Готово! База данных заполнена.")


if __name__ == "__main__":
    asyncio.run(seed_clean())