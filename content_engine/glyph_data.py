# content_engine/glyph_data.py

# ПОЛНЫЙ СПИСОК КХМЕРСКИХ СОГЛАСНЫХ
# series: 1 = A-Group (Sun/Light sound), 2 = O-Group (Moon/Deep sound)

KHMER_CONSONANTS = {
    # --- VELARS (Горловые) ---
    "ក": {"sound": "Ka", "series": 1, "audio": "letter_ka.mp3"},
    "ខ": {"sound": "Kha", "series": 1, "audio": "letter_kha.mp3"},
    "គ": {"sound": "Ko", "series": 2, "audio": "letter_ko.mp3"},
    "ឃ": {"sound": "Kho", "series": 2, "audio": "letter_kho.mp3"},
    "ង": {"sound": "Ngo", "series": 2, "audio": "letter_ngo.mp3"},

    # --- PALATALS (Небные) ---
    "ច": {"sound": "Ja", "series": 1, "audio": "letter_ja.mp3"},
    "ឆ": {"sound": "Cha", "series": 1, "audio": "letter_cha.mp3"},
    "ជ": {"sound": "Jo", "series": 2, "audio": "letter_jo.mp3"},
    "ឈ": {"sound": "Cho", "series": 2, "audio": "letter_cho.mp3"},
    "ញ": {"sound": "Nho", "series": 2, "audio": "letter_nho.mp3"},

    # --- RETROFLEX (Зубные/Альвеолярные - Группа D) ---
    "ដ": {"sound": "Da", "series": 1, "audio": "letter_da.mp3"},
    "ឋ": {"sound": "Tha", "series": 1, "audio": "letter_tha1.mp3"},
    "ឌ": {"sound": "Do", "series": 2, "audio": "letter_do.mp3"},
    "ធ": {"sound": "Tho", "series": 2, "audio": "letter_tho1.mp3"},
    "ណ": {"sound": "Na", "series": 1, "audio": "letter_na.mp3"},

    # --- DENTALS (Зубные - Группа T) ---
    "ត": {"sound": "Ta", "series": 1, "audio": "letter_ta.mp3"},
    "ថ": {"sound": "Tha", "series": 1, "audio": "letter_tha2.mp3"},
    "ទ": {"sound": "To", "series": 2, "audio": "letter_to.mp3"},
    "ធ": {"sound": "Tho", "series": 2, "audio": "letter_tho2.mp3"},  # В кхмерском две Tho, звучат одинаково
    "ន": {"sound": "No", "series": 2, "audio": "letter_no.mp3"},

    # --- LABIALS (Губные) ---
    "ប": {"sound": "Ba", "series": 1, "audio": "letter_ba.mp3"},
    "ផ": {"sound": "Pha", "series": 1, "audio": "letter_pha.mp3"},
    "ព": {"sound": "Po", "series": 2, "audio": "letter_po.mp3"},
    "ភ": {"sound": "Pho", "series": 2, "audio": "letter_pho.mp3"},
    "ម": {"sound": "Mo", "series": 2, "audio": "letter_mo.mp3"},

    # --- GLOTTAL & LIQUIDS (Прочие) ---
    "យ": {"sound": "Yo", "series": 2, "audio": "letter_yo.mp3"},
    "រ": {"sound": "Ro", "series": 2, "audio": "letter_ro.mp3"},
    "ល": {"sound": "Lo", "series": 2, "audio": "letter_lo.mp3"},
    "វ": {"sound": "Vo", "series": 2, "audio": "letter_vo.mp3"},
    "ស": {"sound": "Sa", "series": 1, "audio": "letter_sa.mp3"},
    "ហ": {"sound": "Ha", "series": 1, "audio": "letter_ha.mp3"},
    "ឡ": {"sound": "La", "series": 1, "audio": "letter_la.mp3"},
    "អ": {"sound": "'A", "series": 1, "audio": "letter_a.mp3"},
}


def get_glyph_data(char):
    # Если вдруг попалась редкая буква, даем заглушку
    return KHMER_CONSONANTS.get(char, {
        "sound": "?", "series": 1, "audio": None
    })