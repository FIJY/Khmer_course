import asyncio
import os
import edge_tts

# Папка
OUTPUT_DIR = "khmer-mastery/public/sounds"
VOICE = "km-KH-SreymomNeural"

# Список файлов, которые браузер не может проиграть
BROKEN_FILES = [
    {"text": "ស", "file": "letter_sa.mp3"},
    {"text": "សួស្តី", "file": "hello.mp3"}
]


async def force_fix():
    print("🚑 Принудительное лечение аудиофайлов...")

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    for item in BROKEN_FILES:
        path = os.path.join(OUTPUT_DIR, item['file'])

        # Удаляем старый файл, если он есть (чтобы создать начисто)
        if os.path.exists(path):
            os.remove(path)
            print(f"🗑️ Удален старый файл: {item['file']}")

        print(f"🔊 Генерация нового: {item['text']} -> {item['file']}")

        try:
            communicate = edge_tts.Communicate(item['text'], VOICE)
            await communicate.save(path)
            print(f"✅ Успешно создан!")
        except Exception as e:
            print(f"❌ Ошибка генерации: {e}")


if __name__ == "__main__":
    asyncio.run(force_fix())