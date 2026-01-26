import asyncio
import os
import pandas as pd
import edge_tts

# === НАСТРОЙКИ ===
OUTPUT_CSV = "alphabet_master.csv"  # Этот файл мы загрузим в Supabase
OUTPUT_DIR = "../khmer-mastery/public/sounds"  # Сюда положим аудио
VOICE = "km-KH-SreymomNeural"  # Женский голос

# === ЗОЛОТОЙ СПИСОК (ВСЕ ДАННЫЕ ЗДЕСЬ) ===
# Мы не берем их из старого файла, мы задаем их здесь и сейчас.

DATA = [
    # --- 1. СОГЛАСНЫЕ (33 шт) ---
    # series: 1 = A (Light), 2 = O (Deep)
    {"id": "ក", "name_en": "ka", "type": "consonant", "series": 1, "desc": "Velar. Sound: K (hard). Series: A"},
    {"id": "ខ", "name_en": "kha", "type": "consonant", "series": 1, "desc": "Velar. Sound: Kh (aspirated). Series: A"},
    {"id": "គ", "name_en": "ko", "type": "consonant", "series": 2, "desc": "Velar. Sound: K (soft). Series: O"},
    {"id": "ឃ", "name_en": "kho", "type": "consonant", "series": 2, "desc": "Velar. Sound: Kh (soft). Series: O"},
    {"id": "ង", "name_en": "ngo", "type": "consonant", "series": 2, "desc": "Velar. Sound: Ng. Series: O"},
    {"id": "ច", "name_en": "cha", "type": "consonant", "series": 1, "desc": "Palatal. Sound: Ch. Series: A"},
    {"id": "ឆ", "name_en": "chha", "type": "consonant", "series": 1, "desc": "Palatal. Sound: Chh. Series: A"},
    {"id": "ជ", "name_en": "cho", "type": "consonant", "series": 2, "desc": "Palatal. Sound: Ch (soft). Series: O"},
    {"id": "ឈ", "name_en": "chho", "type": "consonant", "series": 2, "desc": "Palatal. Sound: Chh (soft). Series: O"},
    {"id": "ញ", "name_en": "nyo", "type": "consonant", "series": 2, "desc": "Palatal. Sound: Ny. Series: O"},
    {"id": "ដ", "name_en": "da", "type": "consonant", "series": 1, "desc": "Dental. Sound: D. Series: A"},
    {"id": "ឋ", "name_en": "tha_retro", "type": "consonant", "series": 1, "desc": "Dental. Sound: Th. Series: A"},
    {"id": "ឌ", "name_en": "do", "type": "consonant", "series": 2, "desc": "Dental. Sound: D. Series: O"},
    {"id": "ឍ", "name_en": "tho_retro", "type": "consonant", "series": 2, "desc": "Dental. Sound: Th. Series: O"},
    {"id": "ណ", "name_en": "na", "type": "consonant", "series": 1, "desc": "Dental. Sound: N. Series: A"},
    {"id": "ត", "name_en": "ta", "type": "consonant", "series": 1, "desc": "Dental. Sound: T. Series: A"},
    {"id": "ថ", "name_en": "tha", "type": "consonant", "series": 1, "desc": "Dental. Sound: Th. Series: A"},
    {"id": "ទ", "name_en": "to", "type": "consonant", "series": 2, "desc": "Dental. Sound: T. Series: O"},
    {"id": "ធ", "name_en": "tho", "type": "consonant", "series": 2, "desc": "Dental. Sound: Th. Series: O"},
    {"id": "ន", "name_en": "no", "type": "consonant", "series": 2, "desc": "Dental. Sound: N. Series: O"},
    {"id": "ប", "name_en": "ba", "type": "consonant", "series": 1, "desc": "Labial. Sound: B. Series: A"},
    {"id": "ផ", "name_en": "pha", "type": "consonant", "series": 1, "desc": "Labial. Sound: Ph. Series: A"},
    {"id": "ព", "name_en": "po", "type": "consonant", "series": 2, "desc": "Labial. Sound: P. Series: O"},
    {"id": "ភ", "name_en": "pho", "type": "consonant", "series": 2, "desc": "Labial. Sound: Ph. Series: O"},
    {"id": "ម", "name_en": "mo", "type": "consonant", "series": 2, "desc": "Labial. Sound: M. Series: O"},
    {"id": "យ", "name_en": "yo", "type": "consonant", "series": 2, "desc": "Sound: Y. Series: O"},
    {"id": "រ", "name_en": "ro", "type": "consonant", "series": 2, "desc": "Sound: R. Series: O"},
    {"id": "ល", "name_en": "lo", "type": "consonant", "series": 2, "desc": "Sound: L. Series: O"},
    {"id": "វ", "name_en": "vo", "type": "consonant", "series": 2, "desc": "Sound: V/W. Series: O"},
    {"id": "ស", "name_en": "sa", "type": "consonant", "series": 1, "desc": "Sound: S. Series: A"},
    {"id": "ហ", "name_en": "ha", "type": "consonant", "series": 1, "desc": "Sound: H. Series: A"},
    {"id": "ឡ", "name_en": "la", "type": "consonant", "series": 1, "desc": "Sound: L. Series: A"},
    {"id": "អ", "name_en": "qa", "type": "consonant", "series": 1, "desc": "Glottal Stop. Silent letter. Series: A"},

    # --- 2. ЗАВИСИМЫЕ ГЛАСНЫЕ (23 шт) ---
    # Генерируем 3 файла: Имя (Sra...), Солнце (с 'Or'), Луна (с 'Or'+Treisap)
    {"id": "ា", "name_en": "aa", "type": "vowel_dependent", "desc": "Long 'aa' (A-series) or 'ie' (O-series)"},
    {"id": "ិ", "name_en": "i", "type": "vowel_dependent", "desc": "Short 'i' (A-series) or 'i' (O-series)"},
    {"id": "ី", "name_en": "ei", "type": "vowel_dependent", "desc": "Long 'ei' (A-series) or 'ii' (O-series)"},
    {"id": "ឹ", "name_en": "oe", "type": "vowel_dependent", "desc": "Short 'oe' (A-series) or 'ue' (O-series)"},
    {"id": "ឺ", "name_en": "oeu", "type": "vowel_dependent", "desc": "Long 'oeu' (A-series) or 'ueu' (O-series)"},
    {"id": "ុ", "name_en": "u", "type": "vowel_dependent", "desc": "Short 'u' (A-series) or 'u' (O-series)"},
    {"id": "ូ", "name_en": "oo", "type": "vowel_dependent", "desc": "Long 'oo' (A-series) or 'uu' (O-series)"},
    {"id": "ួ", "name_en": "ua", "type": "vowel_dependent", "desc": "Diphthong 'ua'. Same for both series."},
    {"id": "ើ", "name_en": "aeu", "type": "vowel_dependent", "desc": "Long 'aeu' (A-series) or 'oeu' (O-series)"},
    {"id": "ឿ", "name_en": "oea", "type": "vowel_dependent", "desc": "Diphthong 'oea'. Same for both series."},
    {"id": "ៀ", "name_en": "ie", "type": "vowel_dependent", "desc": "Diphthong 'ie'. Same for both series."},
    {"id": "េ", "name_en": "e", "type": "vowel_dependent", "desc": "Short 'ei' (A-series) or 'ee' (O-series)"},
    {"id": "ែ", "name_en": "ae", "type": "vowel_dependent", "desc": "Long 'ae' (A-series) or 'ae' (O-series)"},
    {"id": "ៃ", "name_en": "ai", "type": "vowel_dependent", "desc": "Diphthong 'ai' (A-series) or 'ey' (O-series)"},
    {"id": "ោ", "name_en": "ao", "type": "vowel_dependent", "desc": "Diphthong 'ao' (A-series) or 'ou' (O-series)"},
    {"id": "ៅ", "name_en": "au", "type": "vowel_dependent", "desc": "Diphthong 'au' (A-series) or 'ov' (O-series)"},
    {"id": "ុំ", "name_en": "om", "type": "vowel_dependent", "desc": "Sound 'om' (A-series) or 'um' (O-series)"},
    {"id": "ំ", "name_en": "am", "type": "vowel_dependent", "desc": "Sound 'am' (A-series) or 'um' (O-series)"},
    {"id": "ាំ", "name_en": "aam", "type": "vowel_dependent", "desc": "Sound 'aam' (A-series) or 'oam' (O-series)"},
    {"id": "ះ", "name_en": "ah", "type": "vowel_dependent", "desc": "Adds breathy 'h'. 'Ah' (A) or 'Eah' (O)"},
    {"id": "ុះ", "name_en": "oh", "type": "vowel_dependent", "desc": "Short 'oh' (A) or 'uh' (O)"},
    {"id": "េះ", "name_en": "eh", "type": "vowel_dependent", "desc": "Short 'eh' (A) or 'ih' (O)"},
    {"id": "ោះ", "name_en": "oh_short", "type": "vowel_dependent", "desc": "Short 'aoh' (A) or 'uoh' (O)"},

    # --- 3. НЕЗАВИСИМЫЕ ГЛАСНЫЕ ---
    {"id": "ឥ", "name_en": "e_indep", "type": "vowel_independent", "desc": "Independent Vowel: E"},
    {"id": "ឦ", "name_en": "ei_indep", "type": "vowel_independent", "desc": "Independent Vowel: EI"},
    {"id": "ឧ", "name_en": "u_indep", "type": "vowel_independent", "desc": "Independent Vowel: U"},
    {"id": "ឪ", "name_en": "au_indep", "type": "vowel_independent", "desc": "Independent Vowel: AU/OV"},
    {"id": "ឫ", "name_en": "ry", "type": "vowel_independent", "desc": "Independent Vowel: RY (short)"},
    {"id": "ឬ", "name_en": "ryy", "type": "vowel_independent", "desc": "Independent Vowel: RYY (long)"},
    {"id": "ឭ", "name_en": "ly", "type": "vowel_independent", "desc": "Independent Vowel: LY (short)"},
    {"id": "ឮ", "name_en": "lyy", "type": "vowel_independent", "desc": "Independent Vowel: LYY (long)"},
    {"id": "ឯ", "name_en": "ae_indep", "type": "vowel_independent", "desc": "Independent Vowel: AE"},
    {"id": "ឱ", "name_en": "ao_indep", "type": "vowel_independent", "desc": "Independent Vowel: AO"},
    {"id": "ឳ", "name_en": "au_ra_indep", "type": "vowel_independent", "desc": "Independent Vowel: AU (Rare)"},

    # --- 4. ДИАКРИТИКИ (Спец. имена) ---
    {"id": "់", "name_en": "bantoc", "type": "diacritic", "spoken": "បន្តក់",
     "desc": "Bantoc. Shortens the vowel sound."},
    {"id": "៌", "name_en": "robabat", "type": "diacritic", "spoken": "របាទ",
     "desc": "Robabat. Used in Sanskrit words."},
    {"id": "៍", "name_en": "tantakheat", "type": "diacritic", "spoken": "ទណ្ឌឃាត",
     "desc": "Tantakheat (Silencer). Mutes the letter."},
    {"id": "៎", "name_en": "kakabat", "type": "diacritic", "spoken": "កាកបាទ", "desc": "Kakabat. Exclamation mark."},
    {"id": "៏", "name_en": "asda", "type": "diacritic", "spoken": "អស្តា", "desc": "Asda. Indicates number 8 or tone."},
    {"id": "័", "name_en": "samyok_sann", "type": "diacritic", "spoken": "សំយោគសញ្ញា",
     "desc": "Samyok Sann. Sanskrit vowel changer."},
    {"id": "ំ", "name_en": "nikahit", "type": "diacritic", "spoken": "និគ្គហិត", "desc": "Nikahit. Nasalizer (Am/Om)."},
    {"id": "ះ", "name_en": "reahmuk", "type": "diacritic", "spoken": "រះមុខ", "desc": "Reahmuk. Aspirator (Ah)."},
    {"id": "ៈ", "name_en": "yuukaleapintu", "type": "diacritic", "spoken": "យុគលពិន្ទុ",
     "desc": "Yuukaleapintu. Glottal stop."},
    {"id": "៉", "name_en": "musakatoan", "type": "diacritic", "spoken": "មូសិកទន្ត",
     "desc": "Musakatoan (Mouse Teeth). Convert O -> A."},
    {"id": "៊", "name_en": "treisap", "type": "diacritic", "spoken": "ត្រីសព្ទ",
     "desc": "Treisap (Fish Face). Convert A -> O."},
    {"id": "្", "name_en": "coeng", "type": "diacritic", "spoken": "ជើង", "desc": "Coeng (Foot). Prepares subscript."},

    # --- 5. ЦИФРЫ (0-10) ---
    {"id": "០", "name_en": "zero", "type": "number", "spoken": "សូន្យ", "desc": "Number 0"},
    {"id": "១", "name_en": "one", "type": "number", "spoken": "មួយ", "desc": "Number 1"},
    {"id": "២", "name_en": "two", "type": "number", "spoken": "ពីរ", "desc": "Number 2"},
    {"id": "៣", "name_en": "three", "type": "number", "spoken": "បី", "desc": "Number 3"},
    {"id": "៤", "name_en": "four", "type": "number", "spoken": "បួន", "desc": "Number 4"},
    {"id": "៥", "name_en": "five", "type": "number", "spoken": "ប្រាំ", "desc": "Number 5"},
    {"id": "៦", "name_en": "six", "type": "number", "spoken": "ប្រាំមួយ", "desc": "Number 6"},
    {"id": "៧", "name_en": "seven", "type": "number", "spoken": "ប្រាំពីរ", "desc": "Number 7"},
    {"id": "៨", "name_en": "eight", "type": "number", "spoken": "ប្រាំបី", "desc": "Number 8"},
    {"id": "៩", "name_en": "nine", "type": "number", "spoken": "ប្រាំបួន", "desc": "Number 9"},
    {"id": "១០", "name_en": "ten", "type": "number", "spoken": "ដប់", "desc": "Number 10"},

    # --- 6. СИМВОЛЫ ---
    {"id": "។", "name_en": "khan", "type": "symbol", "spoken": "ខណ្ឌ", "desc": "Khan. Full stop (Period)."},
    {"id": "ៗ", "name_en": "lek_to", "type": "symbol", "spoken": "លេខទោ", "desc": "Lek To. Repetition sign."},
    {"id": "៕", "name_en": "bariyour", "type": "symbol", "spoken": "បរិយោសាន", "desc": "Bariyour. End of chapter."}
]


async def save_audio(text, filename):
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        print(f"🎙️ Gen: {filename}")
        try:
            comm = edge_tts.Communicate(text, VOICE)
            await comm.save(path)
        except Exception as e:
            print(f"❌ Err: {e}")


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    csv_rows = []
    tasks = []

    print(f"🚀 СТАРТ: Обработка {len(DATA)} элементов...")

    for item in DATA:
        char_id = item['id']
        name_en = item['name_en']
        type_ = item['type']
        desc = item.get('desc', '')

        # --- ФОРМИРУЕМ СТРОКУ CSV (ВСЕ КОЛОНКИ) ---
        row = {
            "id": char_id,
            "name_en": name_en,
            "type": type_,
            "series": item.get('series', ''),
            "shape_group": "",
            "subscript_form": "",
            "sound_series_1": "",  # Заполним ниже, если нужно
            "sound_series_2": "",  # Заполним ниже, если нужно
            "audio_url": "",  # Заполним ниже
            "frequency_rank": 0,
            "description": desc
        }

        # --- ГЕНЕРАЦИЯ АУДИО ---

        if type_ == 'vowel_dependent':
            # 1. ГЛАВНОЕ: Имя ("Сра Аа")
            main_file = f"vowel_name_{name_en}.mp3"
            tasks.append(save_audio("ស្រះ" + char_id, main_file))
            row['audio_url'] = main_file

            # 2. SERIES A (Sun): Используем основу 'អ'
            sun_file = f"vowel_sun_{name_en}.mp3"
            tasks.append(save_audio("អ" + char_id, sun_file))
            row['sound_series_1'] = sun_file

            # 3. SERIES O (Moon): Используем основу 'អ៊' (О + Трэйсап)
            moon_file = f"vowel_moon_{name_en}.mp3"
            tasks.append(save_audio("អ៊" + char_id, moon_file))
            row['sound_series_2'] = moon_file

        elif type_ == 'consonant':
            # Буквы: просто читаем
            main_file = f"letter_{name_en}.mp3"
            tasks.append(save_audio(char_id, main_file))
            row['audio_url'] = main_file

        elif 'spoken' in item:
            # Значки/Цифры: читаем спец. имя (spoken)
            prefix = "number" if type_ == "number" else "sign"
            main_file = f"{prefix}_{name_en}.mp3"
            tasks.append(save_audio(item['spoken'], main_file))
            row['audio_url'] = main_file

        else:
            # Независимые гласные и прочее
            main_file = f"{type_}_{name_en}.mp3"
            tasks.append(save_audio(char_id, main_file))
            row['audio_url'] = main_file

        csv_rows.append(row)

    # --- СОХРАНЯЕМ CSV ---
    df = pd.DataFrame(csv_rows)
    # Порядок колонок как вы просили
    cols = ["id", "name_en", "type", "series", "shape_group", "subscript_form",
            "sound_series_1", "sound_series_2", "audio_url", "frequency_rank", "description"]
    # Добавляем пустые, если каких-то нет
    for c in cols:
        if c not in df.columns: df[c] = ""

    df[cols].to_csv(OUTPUT_CSV, index=False)
    print(f"✅ CSV ГОТОВ: {OUTPUT_CSV} (Загрузите его в Supabase)")

    # --- ЗАПУСК ГЕНЕРАЦИИ ---
    await asyncio.gather(*tasks)
    print("✅ ЗВУКИ ГОТОВЫ: Все файлы в public/sounds/")


if __name__ == "__main__":
    asyncio.run(main())