import asyncio
import os
import edge_tts
from dotenv import load_dotenv
from supabase import create_client, Client

# Настройки
OUTPUT_DIR = "public/sounds"
VOICE = "km-KH-SreymomNeural"  # Женский голос (Камбоджа)

# Загрузка ключей
load_dotenv()
url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("❌ Ошибка: Не найдены ключи Supabase (.env)")
    exit()

supabase: Client = create_client(url, key)


async def audit_and_fix():
    print(f"🕵️‍♀️ Подключаюсь к базе данных...")

    # 1. Забираем ВЕСЬ алфавит из базы
    try:
        response = supabase.table('alphabet').select('*').execute()
        rows = response.data
        print(f"📦 В базе найдено {len(rows)} записей.")
    except Exception as e:
        print(f"❌ Ошибка чтения базы: {e}")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    fixed_count = 0
    missing_count = 0

    print("-" * 50)
    print(f"{'БУКВА':<5} | {'ОЖИДАЕМЫЙ ФАЙЛ':<25} | {'СТАТУС'}")
    print("-" * 50)

    for row in rows:
        char_id = row['id']  # Например: "ស"
        filename = row['audio_url']  # Например: "letter_sa.mp3"

        # Если в базе вдруг пустое поле audio_url, генерируем имя
        if not filename:
            clean_name = row['name_en'].split(' ')[0].lower().replace("'", "")
            prefix = "number" if row['type'] == 'number' else ("vowel" if "vowel" in row['type'] else "letter")
            filename = f"{prefix}_{clean_name}.mp3"
            # (Тут можно было бы обновить базу, но пока просто починим файл)

        file_path = os.path.join(OUTPUT_DIR, filename)
        file_exists = os.path.exists(file_path) and os.path.getsize(file_path) > 100

        status = "✅ OK"

        if not file_exists:
            status = "🛠️ FIXING..."
            missing_count += 1

            # Генерируем текст для озвучки
            # Для гласных добавляем "О" (អ) в начало, чтобы звучало естественно
            text_to_speak = char_id
            if "vowel" in row['type']:
                text_to_speak = "អ" + char_id

            try:
                communicate = edge_tts.Communicate(text_to_speak, VOICE)
                await communicate.save(file_path)
                status = "✨ CREATED"
                fixed_count += 1
            except Exception as e:
                status = f"❌ ERROR: {e}"

        print(f"{char_id:<5} | {filename:<25} | {status}")

    print("-" * 50)
    print(f"🏁 Аудит завершен.")
    print(f"Всего записей: {len(rows)}")
    print(f"Отсутствовало: {missing_count}")
    print(f"Восстановлено: {fixed_count}")


if __name__ == "__main__":
    asyncio.run(audit_and_fix())