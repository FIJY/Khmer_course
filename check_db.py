import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Загружаем ключи
load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)


async def check_lesson_101():
    print("🕵️‍♀️ Проверяю содержимое Урока 1.1 (ID: 101) в базе данных...")

    # Делаем запрос в базу
    try:
        response = supabase.table('lesson_items') \
            .select('*') \
            .eq('lesson_id', 101) \
            .order('order_index', desc=False) \
            .execute()

        items = response.data

        if not items:
            print("❌ ОШИБКА: Урок пустой! В базе нет записей для lesson_id=101.")
            return

        print(f"✅ Найдено карточек: {len(items)}")
        print("-" * 40)

        has_decoder = False

        for item in items:
            type_icon = "❓"
            if item['type'] == 'vocab_card': type_icon = "📇"
            if item['type'] == 'quiz': type_icon = "❓"
            if item['type'] == 'theory': type_icon = "📖"
            if item['type'] == 'visual_decoder':
                type_icon = "🎯"
                has_decoder = True

            print(f"{type_icon} [{item['order_index']}] Тип: {item['type']}")

        print("-" * 40)

        if has_decoder:
            print("🎉 УРА! Visual Decoder (🎯) есть в базе!")
            print("👉 Если ты его не видишь в браузере — значит проблема в КЕШЕ браузера или React-коде.")
        else:
            print("💀 ПЛОХО: Visual Decoder НЕТ в базе.")
            print("👉 Значит script seed_lesson_1.py не сработал или ты забыла его сохранить перед запуском.")

    except Exception as e:
        print(f"Ошибка соединения: {e}")


if __name__ == "__main__":
    asyncio.run(check_lesson_101())