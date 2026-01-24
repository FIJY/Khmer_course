import asyncio
import os

# Если модуль dotenv не найден, скрипт подскажет команду установки
try:
    from dotenv import load_dotenv
except ImportError:
    print("❌ ОШИБКА: Нужно установить библиотеку dotenv.")
    print("👉 Выполни в терминале: pip install python-dotenv")
    exit()

from supabase import create_client, Client

# 1. Загружаем переменные из .env
load_dotenv()

print("🔍 Ищу ключи в .env...")

# 2. Пробуем найти URL (сначала React-версию, потом обычную)
url = os.environ.get("VITE_SUPABASE_URL")
if not url:
    url = os.environ.get("SUPABASE_URL")

# 3. Пробуем найти Ключ
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
if not key:
    key = os.environ.get("SUPABASE_KEY")

print(f"🔑 URL: {'✅ Нашел' if url else '❌ Пусто'}")
print(f"🔑 KEY: {'✅ Нашел' if key else '❌ Пусто'}")

if not url or not key:
    print("\n💀 ОШИБКА: Не могу найти ключи.")
    print("Открой файл .env и проверь, как там названы переменные.")
    print("Они должны быть VITE_SUPABASE_URL=... или SUPABASE_URL=...")
    exit()

# Подключаемся
try:
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"\n💀 Ошибка при создании клиента Supabase: {e}")
    exit()


async def check_lesson_101():
    print("\n🕵️‍♀️ Проверяю содержимое Урока 1.1 (ID: 101)...")

    try:
        response = supabase.table('lesson_items') \
            .select('*') \
            .eq('lesson_id', 101) \
            .order('order_index', desc=False) \
            .execute()

        items = response.data

        if not items:
            print("❌ ВНИМАНИЕ: Урок пустой! В базе нет записей.")
            return

        print(f"✅ В базе найдено {len(items)} карточек для этого урока:")
        print("-" * 40)

        has_decoder = False

        for item in items:
            icon = "❓"
            if item['type'] == 'vocab_card': icon = "📇 Карточка"
            if item['type'] == 'quiz': icon = "❓ Квиз"
            if item['type'] == 'theory': icon = "📖 Теория"
            if item['type'] == 'visual_decoder':
                icon = "🎯 DECODER"
                has_decoder = True

            print(f"[{item['order_index']}] {icon} (ID: {item['id']})")

        print("-" * 40)

        if has_decoder:
            print("🎉 УСПЕХ! Visual Decoder есть в базе данных!")
            print("Если ты не видишь его в браузере — очисти кеш (Ctrl+F5) или перезапусти 'npm run dev'.")
        else:
            print("💀 Visual Decoder НЕТ в базе.")
            print("Нужно запустить скрипт: python content_engine/seed_lesson_json_my.py")

    except Exception as e:
        print(f"Ошибка соединения с базой: {e}")


if __name__ == "__main__":
    asyncio.run(check_lesson_101())
