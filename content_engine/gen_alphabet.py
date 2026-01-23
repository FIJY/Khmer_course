import asyncio
import os
import edge_tts

# === НАСТРОЙКИ ПУТЕЙ ===
current_dir = os.getcwd()

# Логика поиска папки сайта (чтобы файлы попали сразу в React проект)
if os.path.exists(os.path.join(current_dir, "public")):
    # Мы внутри khmer-mastery
    BASE_DIR = os.path.join(current_dir, "public", "sounds")
elif os.path.exists(os.path.join(current_dir, "khmer-mastery", "public")):
    # Мы в корне (над khmer-mastery)
    BASE_DIR = os.path.join(current_dir, "khmer-mastery", "public", "sounds")
elif os.path.exists(os.path.join(current_dir, "..", "khmer-mastery", "public")):
    # Мы в соседней папке (например, content_engine)
    BASE_DIR = os.path.join(current_dir, "..", "khmer-mastery", "public", "sounds")
else:
    # Если не нашли, кидаем рядом
    BASE_DIR = os.path.join(current_dir, "sounds_output")

# Нормализуем путь (убираем ..)
BASE_DIR = os.path.abspath(BASE_DIR)

os.makedirs(BASE_DIR, exist_ok=True)
print(f"📂 ФАЙЛЫ ПОЛЕТЯТ СЮДА:\n   >>> {BASE_DIR}\n")

# === ГОЛОС ===
VOICE = "km-KH-PisethNeural"

# === 1. СОГЛАСНЫЕ ===
CONSONANTS = [
    ("ក", "letter_ka"), ("ខ", "letter_kha"), ("គ", "letter_ko"), ("ឃ", "letter_kho"), ("ង", "letter_ngo"),
    ("ច", "letter_cha"), ("ឆ", "letter_chha"), ("ជ", "letter_cho"), ("ឈ", "letter_chho"), ("ញ", "letter_nyo"),
    ("ដ", "letter_da"), ("ឋ", "letter_tha_retro"), ("ឌ", "letter_do"), ("ឍ", "letter_tho_retro"), ("ណ", "letter_na"),
    ("ត", "letter_ta"), ("ថ", "letter_tha"), ("ទ", "letter_to"), ("ធ", "letter_tho"), ("ន", "letter_no"),
    ("ប", "letter_ba"), ("ផ", "letter_pha"), ("ព", "letter_po"), ("ភ", "letter_pho"), ("ម", "letter_mo"),
    ("យ", "letter_yo"), ("រ", "letter_ro"), ("ល", "letter_lo"), ("វ", "letter_vo"),
    ("ស", "letter_sa"), ("ហ", "letter_ha"), ("ឡ", "letter_la"), ("អ", "letter_qa"),
]

# === 2. ГЛАСНЫЕ (ЗВУКИ) ===
VOWELS_DATA = [
    ("ា", "aa"), ("ិ", "i"), ("ី", "ey"),
    ("ឹ", "oe"), ("ឺ", "oeu"), ("ុ", "u"),
    ("ូ", "oo"), ("ួ", "ua"), ("ើ", "aeu"),
    ("ឿ", "oea"), ("ៀ", "ie"), ("េ", "e"),
    ("ែ", "ae"), ("ៃ", "ai"), ("ោ", "ao"),
    ("ៅ", "au"),
    ("ុំ", "om"), ("ំ", "am"), ("ាំ", "aam"),
    ("ះ", "ah"), ("ុះ", "oh"), ("េះ", "eh"),
    ("ោះ", "oh_short"),
]

# === 3. НАЗВАНИЯ ГЛАСНЫХ (Sra ...) ===
VOWEL_NAMES_DATA = [
    ("ស្រះ" + v, f"vowel_name_{name}") for v, name in VOWELS_DATA
]

# === 4. НЕЗАВИСИМЫЕ ГЛАСНЫЕ (С ИСПРАВЛЕНИЯМИ) ===
INDEP_VOWELS = [
    ("ឥ", "indep_e"),
    ("អី", "indep_ei"),  # ФИКС: Вместо ឦ шлем sound-alike អី
    ("ឧ", "indep_o"),
    ("ឧក", "indep_ok"),  # ФИКС: Вместо устаревшей ឨ шлем sound-alike ឧក
    ("ឪ", "indep_au"),
    ("ឫ", "indep_rue"),
    ("ឬ", "indep_rue_long"),
    ("ឭ", "indep_lue"),
    ("ឮ", "indep_lue_long"),
    ("ឯ", "indep_ae"),
    ("ឱ", "indep_ao"),
]


async def generate_file(text, filename):
    file_path = os.path.join(BASE_DIR, f"{filename}.mp3")
    try:
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(file_path)
        return True
    except Exception as e:
        print(f"❌ Error {filename}: {e}")
        return False


async def main():
    print(f"🚀 Генерация полного алфавита (v2 - Fixed)...")

    tasks = []

    # 1. Согласные
    for char, fname in CONSONANTS:
        tasks.append(generate_file(char, fname))

    # 2. Гласные (SUN) - используем основу "អ"
    for char, fname in VOWELS_DATA:
        sun_text = "អ" + char
        tasks.append(generate_file(sun_text, f"vowel_sun_{fname}"))

    # 3. Гласные (MOON) - используем основу "អ៊"
    for char, fname in VOWELS_DATA:
        moon_text = "អ៊" + char
        tasks.append(generate_file(moon_text, f"vowel_moon_{fname}"))

    # 4. Названия (Sra)
    for char, fname in VOWEL_NAMES_DATA:
        tasks.append(generate_file(char, fname))

    # 5. Независимые
    for char, fname in INDEP_VOWELS:
        tasks.append(generate_file(char, fname))

    print(f"⏳ Обработка {len(tasks)} файлов...")
    await asyncio.gather(*tasks)
    print("\n✅ ГОТОВО! Ошибок быть не должно.")


if __name__ == "__main__":
    asyncio.run(main())