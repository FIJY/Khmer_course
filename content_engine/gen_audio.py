import asyncio
import os
import edge_tts

# Голоса
VOICE_FEMALE = "km-KH-SreymomNeural"
VOICE_MALE = "km-KH-PisethNeural"

OUTPUT_FOLDER = "audio_files"

# Список: (Имя файла, Текст кхмерский, Текст английский, Пол голоса)
# 'f' = female, 'm' = male
phrases = [
    # --- Важные гендерные различия ---
    ("yes_female", "ចាស", "Yes (Female)", 'f'),
    ("yes_male", "បាទ", "Yes (Male)", 'm'),

    # --- База (озвучим женским голосом, так приятнее слушать) ---
    ("hello", "សួស្តី", "Hello", 'f'),
    ("thank_you", "អរគុណ", "Thank you", 'f'),
    ("sorry", "សុំទោស", "Sorry", 'f'),
    ("no", "ទេ", "No", 'f'),  # Часто говорят "Ot-tei", но "Te" это литературно "Нет"

    # --- Рынок ---
    ("how_much", "ថ្លៃប៉ុន្មាន?", "How much?", 'f'),
    ("too_expensive", "ថ្លៃណាស់", "Too expensive", 'f'),
    ("discount", "ចុះថ្លៃបានទេ?", "Can you discount?", 'f'),
    ("i_take_this", "ខ្ញុំយកមួយនេះ", "I take this", 'f'),

    # --- Еда ---
    ("delicious", "ឆ្ងាញ់ណាស់", "Delicious", 'f'),
    ("bill_please", "គិតលុយ", "Bill please", 'f'),
    ("no_sugar", "អត់ស្ករ", "No sugar", 'f'),
    ("no_ice", "អត់ទឹកកក", "No ice", 'f'),
    ("water", "ទឹក", "Water", 'f'),

    # --- Навигация ---
    ("turn_left", "បត់ឆ្វេង", "Turn left", 'f'),
    ("turn_right", "បត់ស្តាំ", "Turn right", 'f'),
    ("stop_here", "ឈប់ទីនេះ", "Stop here", 'f'),
    ("go_straight", "ទៅត្រង់", "Go straight", 'f'),
]


async def generate_audio():
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)

    print(f"🚀 Генерация правильных фраз ({len(phrases)} шт)...")

    for filename, text_km, text_en, gender in phrases:
        output_path = os.path.join(OUTPUT_FOLDER, f"{filename}.mp3")

        # Выбираем правильный голос
        voice = VOICE_MALE if gender == 'm' else VOICE_FEMALE

        communicate = edge_tts.Communicate(text_km, voice)
        await communicate.save(output_path)
        print(f"✅ {filename}.mp3 -> Озвучено: {'Мужчиной' if gender == 'm' else 'Женщиной'} ({text_km})")

    print("\n🎉 Готово! Проверь файлы yes_male и yes_female.")


if __name__ == "__main__":
    asyncio.run(generate_audio())