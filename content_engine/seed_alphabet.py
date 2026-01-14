import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import edge_tts

load_dotenv()
url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# ПОЛНЫЙ СПИСОК (Top 50+ из твоей статистики)
FULL_ALPHABET = [
    # --- ГЛАСНЫЕ И ДИАКРИТИКИ (Самые частые!) ---
    {"id": "ា", "en": "aa", "type": "vowel_dependent", "freq": 1},
    {"id": "្", "en": "virama", "type": "diacritic", "freq": 2},  # Знак подписки (Coeng)
    {"id": "់", "en": "bantoc", "type": "diacritic", "freq": 13},  # Укоротитель
    {"id": "ិ", "en": "i", "type": "vowel_dependent", "freq": 14},
    {"id": "ុ", "en": "u", "type": "vowel_dependent", "freq": 15},
    {"id": "ំ", "en": "nikahit", "type": "diacritic", "freq": 20},  # Кружочек сверху (м)
    {"id": "េ", "en": "ei", "type": "vowel_dependent", "freq": 21},
    {"id": "ី", "en": "ey", "type": "vowel_dependent", "freq": 23},
    {"id": "ើ", "en": "oe", "type": "vowel_dependent", "freq": 24},
    {"id": "ែ", "en": "ae", "type": "vowel_dependent", "freq": 25},
    {"id": "ោ", "en": "ao", "type": "vowel_dependent", "freq": 26},
    {"id": "ះ", "en": "reahmuk", "type": "diacritic", "freq": 30},  # Две точки (х)
    {"id": "ូ", "en": "oo", "type": "vowel_dependent", "freq": 31},
    {"id": "ួ", "en": "uor", "type": "vowel_dependent", "freq": 32},
    {"id": "ៅ", "en": "au", "type": "vowel_dependent", "freq": 37},
    {"id": "ឹ", "en": "oeu", "type": "vowel_dependent", "freq": 41},
    {"id": "៉", "en": "musakatoan", "type": "diacritic", "freq": 43},  # "Зубы" (меняет серию на 1)
    {"id": "ៃ", "en": "ai", "type": "vowel_dependent", "freq": 44},
    {"id": "ៀ", "en": "ie", "type": "vowel_dependent", "freq": 45},
    {"id": "ឲ", "en": "aoy", "type": "vowel_independent", "freq": 48},
    {"id": "័", "en": "samyok_sann", "type": "diacritic", "freq": 49},
    {"id": "៊", "en": "treisap", "type": "diacritic", "freq": 50},  # "Волны" (меняет серию на 2)
    {"id": "ឺ", "en": "eu", "type": "vowel_dependent", "freq": 51},
    {"id": "៏", "en": "asda", "type": "diacritic", "freq": 53},  # "8" сверху
    {"id": "៍", "en": "tantakheat", "type": "diacritic", "freq": 54},  # Глушитель
    {"id": "ៈ", "en": "yuukaleapintu", "type": "diacritic", "freq": 55},
    {"id": "ឿ", "en": "yeua", "type": "vowel_dependent", "freq": 58},
    {"id": "ឯ", "en": "ae_indep", "type": "vowel_independent", "freq": 60},
    {"id": "ឧ", "en": "u_indep", "type": "vowel_independent", "freq": 61},
    {"id": "ៗ", "en": "lek_to", "type": "symbol", "freq": 62},  # Повторитель
    {"id": "៌", "en": "robabat", "type": "diacritic", "freq": 63},
    {"id": "ឥ", "en": "e_indep", "type": "vowel_independent", "freq": 64},
    {"id": "ឱ", "en": "ao_indep", "type": "vowel_independent", "freq": 66},
    {"id": "ឬ", "en": "ry", "type": "vowel_independent", "freq": 67},
    {"id": "ឪ", "en": "ov", "type": "vowel_independent", "freq": 68},
    {"id": "ឭ", "en": "ly", "type": "vowel_independent", "freq": 69},
    {"id": "ឫ", "en": "ryy", "type": "vowel_independent", "freq": 70},
    {"id": "ឮ", "en": "lyy", "type": "vowel_independent", "freq": 71},
    {"id": "ឦ", "en": "ei_indep", "type": "vowel_independent", "freq": 72},
    {"id": "ឳ", "en": "ok", "type": "vowel_independent", "freq": 77},
    {"id": "៎", "en": "kakabat", "type": "diacritic", "freq": 78},

    # --- ЦИФРЫ ---
    {"id": "០", "en": "zero", "type": "number", "freq": 73},
    {"id": "១", "en": "one", "type": "number", "freq": 75},
    {"id": "២", "en": "two", "type": "number", "freq": 74},
    {"id": "៣", "en": "three", "type": "number", "freq": 79},
    {"id": "៥", "en": "five", "type": "number", "freq": 76},

    # --- СОГЛАСНЫЕ (Вставляю 33 штуки из прошлого списка) ---
    {"id": "ន", "en": "No", "type": "consonant", "series": 2, "freq": 3},
    {"id": "រ", "en": "Ro", "type": "consonant", "series": 2, "freq": 4},
    {"id": "ក", "en": "Ka", "type": "consonant", "series": 1, "freq": 5},
    {"id": "ប", "en": "Ba", "type": "consonant", "series": 1, "freq": 6},
    {"id": "ម", "en": "Mo", "type": "consonant", "series": 2, "freq": 7},
    {"id": "ង", "en": "Ngo", "type": "consonant", "series": 2, "freq": 8},
    {"id": "ស", "en": "Sa", "type": "consonant", "series": 1, "freq": 9},
    {"id": "ត", "en": "Ta", "type": "consonant", "series": 1, "freq": 10},
    {"id": "ល", "en": "Lo", "type": "consonant", "series": 2, "freq": 11},
    {"id": "យ", "en": "Yo", "type": "consonant", "series": 2, "freq": 12},
    {"id": "ទ", "en": "To", "type": "consonant", "series": 2, "freq": 16},
    {"id": "ព", "en": "Po", "type": "consonant", "series": 2, "freq": 17},
    {"id": "ដ", "en": "Da", "type": "consonant", "series": 1, "freq": 18},
    {"id": "ច", "en": "Ja", "type": "consonant", "series": 1, "freq": 19},
    {"id": "ជ", "en": "Jo", "type": "consonant", "series": 2, "freq": 22},
    {"id": "វ", "en": "Vo", "type": "consonant", "series": 2, "freq": 27},
    {"id": "គ", "en": "Ko", "type": "consonant", "series": 2, "freq": 28},
    {"id": "អ", "en": "'A", "type": "consonant", "series": 1, "freq": 29},
    {"id": "ថ", "en": "Tha", "type": "consonant", "series": 1, "freq": 33},
    {"id": "ខ", "en": "Kha", "type": "consonant", "series": 1, "freq": 34},
    {"id": "ញ", "en": "Nho", "type": "consonant", "series": 2, "freq": 35},
    {"id": "ណ", "en": "Na", "type": "consonant", "series": 1, "freq": 36},
    {"id": "ហ", "en": "Ha", "type": "consonant", "series": 1, "freq": 38},
    {"id": "ធ", "en": "Tho", "type": "consonant", "series": 2, "freq": 39},
    {"id": "ភ", "en": "Pho", "type": "consonant", "series": 2, "freq": 40},
    {"id": "ផ", "en": "Pha", "type": "consonant", "series": 1, "freq": 42},
    {"id": "ឡ", "en": "La", "type": "consonant", "series": 1, "freq": 46},
    {"id": "ឆ", "en": "Cha", "type": "consonant", "series": 1, "freq": 47},
    {"id": "ឋ", "en": "Tha (Retro)", "type": "consonant", "series": 1, "freq": 52},
    {"id": "ឈ", "en": "Cho", "type": "consonant", "series": 2, "freq": 56},
    {"id": "ឃ", "en": "Kho", "type": "consonant", "series": 2, "freq": 57},
    {"id": "ឌ", "en": "Do", "type": "consonant", "series": 2, "freq": 59},
    {"id": "ឍ", "en": "Tho (Retro)", "type": "consonant", "series": 2, "freq": 65},
]


async def seed_alphabet():
    print(f"🌟 Загружаю {len(FULL_ALPHABET)} символов в базу...")

    rows = []
    for item in FULL_ALPHABET:
        # Генерация имени файла
        # Согласные: letter_ka.mp3
        # Гласные/Диакритики: vowel_aa.mp3
        # Цифры: number_one.mp3

        prefix = "letter"
        if item['type'] in ['vowel_dependent', 'vowel_independent', 'diacritic']: prefix = "vowel"
        if item['type'] == 'number': prefix = "number"
        if item['type'] == 'symbol': prefix = "symbol"

        clean_name = item['en'].split(' ')[0].lower().replace("'", "").replace("(", "").replace(")", "")
        filename = f"{prefix}_{clean_name}.mp3"

        row = {
            "id": item["id"],
            "name_en": item["en"],
            "type": item["type"],
            "frequency_rank": item["freq"],
            "audio_url": filename,
            "series": item.get("series", None)  # Только для согласных
        }
        rows.append(row)

    try:
        supabase.table('alphabet').upsert(rows).execute()
        print("✅ Успешно!")
    except Exception as e:
        print(f"❌ Ошибка: {e}")


if __name__ == "__main__":
    asyncio.run(seed_alphabet())

OUTPUT_DIR = "khmer-mastery/public/sounds"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# ТОТ ЖЕ СПИСОК (Для генерации имен файлов и текста)
# Я использую сокращенный вариант для примера, но он должен совпадать с базой
ALPHABET_MAP = [
    # ГЛАСНЫЕ (Для озвучки добавим 'អ' перед ними, чтобы звучало естественно "Аа", "И", "У")
    {"text": "អា", "file": "vowel_aa.mp3"},
    {"text": "អិ", "file": "vowel_i.mp3"},
    {"text": "អី", "file": "vowel_ey.mp3"},
    {"text": "អុ", "file": "vowel_u.mp3"},
    {"text": "អូ", "file": "vowel_oo.mp3"},
    {"text": "អៀ", "file": "vowel_ie.mp3"},
    {"text": "អេ", "file": "vowel_ei.mp3"},
    {"text": "អែ", "file": "vowel_ae.mp3"},
    {"text": "អោ", "file": "vowel_ao.mp3"},
    {"text": "អៅ", "file": "vowel_au.mp3"},

    # СОГЛАСНЫЕ
    {"text": "ក", "file": "letter_ka.mp3"},
    {"text": "ខ", "file": "letter_kha.mp3"},
    {"text": "គ", "file": "letter_ko.mp3"},
    {"text": "ឃ", "file": "letter_kho.mp3"},
    {"text": "ង", "file": "letter_ngo.mp3"},
    {"text": "ច", "file": "letter_ja.mp3"},
    {"text": "ឆ", "file": "letter_cha.mp3"},
    {"text": "ជ", "file": "letter_jo.mp3"},
    {"text": "ឈ", "file": "letter_cho.mp3"},
    {"text": "ញ", "file": "letter_nho.mp3"},
    {"text": "ដ", "file": "letter_da.mp3"},
    {"text": "ឋ", "file": "letter_tha.mp3"},
    {"text": "ឌ", "file": "letter_do.mp3"},
    {"text": "ធ", "file": "letter_tho.mp3"},
    {"text": "ណ", "file": "letter_na.mp3"},
    {"text": "ត", "file": "letter_ta.mp3"},
    {"text": "ថ", "file": "letter_tha2.mp3"},
    {"text": "ទ", "file": "letter_to.mp3"},
    {"text": "ធ", "file": "letter_tho2.mp3"},
    {"text": "ន", "file": "letter_no.mp3"},
    {"text": "ប", "file": "letter_ba.mp3"},
    {"text": "ផ", "file": "letter_pha.mp3"},
    {"text": "ព", "file": "letter_po.mp3"},
    {"text": "ភ", "file": "letter_pho.mp3"},
    {"text": "ម", "file": "letter_mo.mp3"},
    {"text": "យ", "file": "letter_yo.mp3"},
    {"text": "រ", "file": "letter_ro.mp3"},
    {"text": "ល", "file": "letter_lo.mp3"},
    {"text": "វ", "file": "letter_vo.mp3"},
    {"text": "ស", "file": "letter_sa.mp3"},
    {"text": "ហ", "file": "letter_ha.mp3"},
    {"text": "ឡ", "file": "letter_la.mp3"},
    {"text": "អ", "file": "letter_a.mp3"},

    # ЦИФРЫ
    {"text": "០", "file": "number_zero.mp3"},
    {"text": "១", "file": "number_one.mp3"},
    {"text": "២", "file": "number_two.mp3"},
    {"text": "៣", "file": "number_three.mp3"},
    {"text": "៤", "file": "number_four.mp3"},
    {"text": "៥", "file": "number_five.mp3"}
]

# Выбираем голос (Кхмерский - Камбоджа)
VOICE = "km-KH-SreymomNeural"


# Другой вариант: "km-KH-PisethNeural" (мужской)

async def generate_all():
    print(f"🎙️ Начинаю генерацию {len(ALPHABET_MAP)} файлов...")

    for item in ALPHABET_MAP:
        path = os.path.join(OUTPUT_DIR, item['file'])

        # Если файл уже есть - пропускаем (чтобы не тратить трафик)
        if os.path.exists(path):
            print(f"⏩ Пропуск: {item['file']} (уже есть)")
            continue

        print(f"🔊 Генерация: {item['text']} -> {item['file']}")

        try:
            communicate = edge_tts.Communicate(item['text'], VOICE)
            await communicate.save(path)
        except Exception as e:
            print(f"❌ Ошибка с {item['file']}: {e}")

    print("✅ Готово! Файлы в папке public/sounds/")


if __name__ == "__main__":
    asyncio.run(generate_all())