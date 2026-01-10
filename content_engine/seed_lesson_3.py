import asyncio
import os
import edge_tts
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# --- НАСТРОЙКИ ---
LESSON_TITLE = "Money & Numbers (Ultimate)"
VOICE = "km-KH-PisethNeural"
SPEED = "-20%"
FORCE_UPDATE_AUDIO = False

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

AUDIO_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "khmer-mastery" / "public" / "sounds"
AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

supabase: Client = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# === ПРАВИЛЬНАЯ СТРУКТУРА: УЧИМ → ТЕСТИРУЕМ ===
CONTENT = [
    # ============================================
    # БЛОК 1: ЧИСЛА 1-5 (БАЗА)
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 1: Numbers 1-5",
            "text": "Start with the foundation. These 5 numbers are building blocks for everything."
        }
    },
    {"type": "vocab_card", "data": {"front": "1 — One", "back": "មួយ", "pronunciation": "Mouy", "audio": "1.mp3"}},
    {"type": "vocab_card", "data": {"front": "2 — Two", "back": "ពីរ", "pronunciation": "Pii", "audio": "2.mp3"}},
    {"type": "vocab_card", "data": {"front": "3 — Three", "back": "បី", "pronunciation": "Bei", "audio": "3.mp3"}},
    {"type": "vocab_card", "data": {"front": "4 — Four", "back": "បួន", "pronunciation": "Buan", "audio": "4.mp3"}},
    {"type": "vocab_card", "data": {"front": "5 — Five", "back": "ប្រាំ", "pronunciation": "Pram", "audio": "5.mp3"}},
    {
        "type": "quiz",
        "data": {
            "question": "What is 'Three' in Khmer?",
            "options": [
                "បី (Bei)",
                "ពីរ (Pii)",
                "បួន (Buan)"
            ],
            "correct_answer": "បី (Bei)",
            "explanation": "3 = បី (Bei)",
            "audio_map": {"បី (Bei)": "3.mp3"}
        }
    },
    {
        "type": "quiz",
        "data": {
            "question": "What is 'Five' in Khmer?",
            "options": [
                "ប្រាំ (Pram)",
                "បួន (Buan)",
                "ប្រាំមួយ (Pram-Mouy)"
            ],
            "correct_answer": "ប្រាំ (Pram)",
            "explanation": "5 = ប្រាំ (Pram) — you'll use this a lot!",
            "audio_map": {"ប្រាំ (Pram)": "5.mp3"}
        }
    },

    # ============================================
    # БЛОК 2: ПАТТЕРН "5 + X" (6-9)
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 2: Pattern '5 + Number' (6-9)",
            "text": "Khmer uses '5 + X' for 6-9:\n• 6 = ប្រាំ (5) + មួយ (1)\n• 7 = ប្រាំ + ពីរ\n• 8 = ប្រាំ + បី\n• 9 = ប្រាំ + បួន"
        }
    },
    {"type": "vocab_card",
     "data": {"front": "6 — Six (5+1)", "back": "ប្រាំមួយ", "pronunciation": "Pram-Mouy", "audio": "6.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "7 — Seven (5+2)", "back": "ប្រាំពីរ", "pronunciation": "Pram-Pii", "audio": "7.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "8 — Eight (5+3)", "back": "ប្រាំបី", "pronunciation": "Pram-Bei", "audio": "8.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "9 — Nine (5+4)", "back": "ប្រាំបួន", "pronunciation": "Pram-Buan", "audio": "9.mp3"}},

    {
        "type": "quiz",
        "data": {
            "question": "If 5 = ប្រាំ (Pram) and 2 = ពីរ (Pii), what is 7?",
            "options": [
                "ប្រាំពីរ (Pram-Pii)",
                "ប្រាំបី (Pram-Bei)",
                "ពីរប្រាំ (Pii-Pram)"
            ],
            "correct_answer": "ប្រាំពីរ (Pram-Pii)",
            "explanation": "7 = 5+2 → ប្រាំ + ពីរ = ប្រាំពីរ",
            "audio_map": {"ប្រាំពីរ (Pram-Pii)": "7.mp3"}
        }
    },
    {
        "type": "quiz",
        "data": {
            "question": "Using the pattern, what is 9?",
            "options": [
                "ប្រាំបួន (Pram-Buan)",
                "ប្រាំបី (Pram-Bei)",
                "ប្រាំប្រាំ (Pram-Pram)"
            ],
            "correct_answer": "ប្រាំបួន (Pram-Buan)",
            "explanation": "9 = 5+4 → ប្រាំ + បួន (Pram + Buan)",
            "audio_map": {"ប្រាំបួន (Pram-Buan)": "9.mp3"}
        }
    },

    # ============================================
    # БЛОК 3: ДОБАВЛЯЕМ 0 И 10
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 3: Zero and Ten",
            "text": "Complete the basics! Now you know 0-10."
        }
    },
    {"type": "vocab_card", "data": {"front": "0 — Zero", "back": "សូន្យ", "pronunciation": "Soun", "audio": "0.mp3"}},
    {"type": "vocab_card", "data": {"front": "10 — Ten", "back": "ដប់", "pronunciation": "Dop", "audio": "10.mp3"}},

    {
        "type": "quiz",
        "data": {
            "question": "What is 'Ten' in Khmer?",
            "options": [
                "ដប់ (Dop)",
                "ប្រាំបួន (Pram-Buan)",
                "ដប់មួយ (Dop-Mouy)"
            ],
            "correct_answer": "ដប់ (Dop)",
            "explanation": "10 = ដប់ (Dop). This is used for 11-19!",
            "audio_map": {"ដប់ (Dop)": "10.mp3"}
        }
    },

    # ============================================
    # БЛОК 4: ПАТТЕРН "10 + X" (11-19)
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 4: Pattern 'Ten + Number' (11-19)",
            "text": "Simple pattern: ដប់ (ten) + number\n• 11 = ដប់ + មួយ\n• 17 = ដប់ + ប្រាំពីរ (ten + seven)"
        }
    },
    {"type": "vocab_card",
     "data": {"front": "11 — Eleven (10+1)", "back": "ដប់មួយ", "pronunciation": "Dop-Mouy", "audio": "11.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "12 — Twelve (10+2)", "back": "ដប់ពីរ", "pronunciation": "Dop-Pii", "audio": "12.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "13 — Thirteen (10+3)", "back": "ដប់បី", "pronunciation": "Dop-Bei", "audio": "13.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "14 — Fourteen (10+4)", "back": "ដប់បួន", "pronunciation": "Dop-Buan", "audio": "14.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "15 — Fifteen (10+5)", "back": "ដប់ប្រាំ", "pronunciation": "Dop-Pram", "audio": "15.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "16 — Sixteen (10+6)", "back": "ដប់ប្រាំមួយ", "pronunciation": "Dop-Pram-Mouy",
              "audio": "16.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "17 — Seventeen (10+7)", "back": "ដប់ប្រាំពីរ", "pronunciation": "Dop-Pram-Pii",
              "audio": "17.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "18 — Eighteen (10+8)", "back": "ដប់ប្រាំបី", "pronunciation": "Dop-Pram-Bei",
              "audio": "18.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "19 — Nineteen (10+9)", "back": "ដប់ប្រាំបួន", "pronunciation": "Dop-Pram-Buan",
              "audio": "19.mp3"}},

    {
        "type": "quiz",
        "data": {
            "question": "Using the pattern, what is 17?",
            "options": [
                "ដប់ប្រាំពីរ (Dop-Pram-Pii)",
                "ដប់ប្រាំបី (Dop-Pram-Bei)",
                "ប្រាំពីរដប់ (Pram-Pii-Dop)"
            ],
            "correct_answer": "ដប់ប្រាំពីរ (Dop-Pram-Pii)",
            "explanation": "17 = 10+7 → ដប់ + ប្រាំពីរ",
            "audio_map": {"ដប់ប្រាំពីរ (Dop-Pram-Pii)": "17.mp3"}
        }
    },

    # ============================================
    # БЛОК 5: ДЕСЯТКИ (20-90)
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 5: The Tens (20-90)",
            "text": "These are unique words — you need to memorize them!\n• 20 = ម្ភៃ (special)\n• 30-90 end with 'សិប' (sep)"
        }
    },
    {"type": "vocab_card",
     "data": {"front": "20 — Twenty", "back": "ម្ភៃ", "pronunciation": "Ma-Phei", "audio": "20.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "30 — Thirty", "back": "សាមសិប", "pronunciation": "Sam-Sep", "audio": "30.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "40 — Forty", "back": "សែសិប", "pronunciation": "Sae-Sep", "audio": "40.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "50 — Fifty", "back": "ហាសិប", "pronunciation": "Ha-Sep", "audio": "50.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "60 — Sixty", "back": "ហុកសិប", "pronunciation": "Hok-Sep", "audio": "60.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "70 — Seventy", "back": "ចិតសិប", "pronunciation": "Chet-Sep", "audio": "70.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "80 — Eighty", "back": "ប៉ែតសិប", "pronunciation": "Paet-Sep", "audio": "80.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "90 — Ninety", "back": "កៅសិប", "pronunciation": "Kao-Sep", "audio": "90.mp3"}},

    {
        "type": "quiz",
        "data": {
            "question": "What is 50?",
            "options": [
                "ហាសិប (Ha-Sep)",
                "ហុកសិប (Hok-Sep)",
                "ប្រាំសិប (Pram-Sep)"
            ],
            "correct_answer": "ហាសិប (Ha-Sep)",
            "explanation": "50 = ហាសិប (Ha-Sep)",
            "audio_map": {"ហាសិប (Ha-Sep)": "50.mp3"}
        }
    },
    {
        "type": "quiz",
        "data": {
            "question": "What is 70?",
            "options": [
                "ចិតសិប (Chet-Sep)",
                "ហុកសិប (Hok-Sep)",
                "ប៉ែតសិប (Paet-Sep)"
            ],
            "correct_answer": "ចិតសិប (Chet-Sep)",
            "explanation": "70 = ចិតសិប (Chet-Sep)",
            "audio_map": {"ចិតសិប (Chet-Sep)": "70.mp3"}
        }
    },

    # ============================================
    # БЛОК 6: КОМБИНИРУЕМ ДЕСЯТКИ + ЕДИНИЦЫ (21-99)
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 6: Combining Tens + Units",
            "text": "Pattern: Tens + unit\n• 21 = ម្ភៃ (20) + មួយ (1)\n• 47 = សែសិប (40) + ប្រាំពីរ (7)"
        }
    },
    {"type": "vocab_card",
     "data": {"front": "21 — Twenty-one", "back": "ម្ភៃមួយ", "pronunciation": "Ma-Phei-Mouy", "audio": "21.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "35 — Thirty-five", "back": "សាមសិបប្រាំ", "pronunciation": "Sam-Sep-Pram", "audio": "35.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "47 — Forty-seven", "back": "សែសិបប្រាំពីរ", "pronunciation": "Sae-Sep-Pram-Pii",
              "audio": "47.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "58 — Fifty-eight", "back": "ហាសិបប្រាំបី", "pronunciation": "Ha-Sep-Pram-Bei",
              "audio": "58.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "69 — Sixty-nine", "back": "ហុកសិបប្រាំបួន", "pronunciation": "Hok-Sep-Pram-Buan",
              "audio": "69.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "99 — Ninety-nine", "back": "កៅសិបប្រាំបួន", "pronunciation": "Kao-Sep-Pram-Buan",
              "audio": "99.mp3"}},

    {
        "type": "quiz",
        "data": {
            "question": "If 40 = សែសិប and 7 = ប្រាំពីរ, what is 47?",
            "options": [
                "សែសិបប្រាំពីរ (Sae-Sep-Pram-Pii)",
                "ប្រាំពីរសែសិប (Pram-Pii-Sae-Sep)",
                "សែសិបចិត (Sae-Sep-Chet)"
            ],
            "correct_answer": "សែសិបប្រាំពីរ (Sae-Sep-Pram-Pii)",
            "explanation": "47 = 40 + 7 → សែសិប + ប្រាំពីរ",
            "audio_map": {"សែសិបប្រាំពីរ (Sae-Sep-Pram-Pii)": "47.mp3"}
        }
    },

    # ============================================
    # БЛОК 7: СОТНИ (100, 200...)
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 7: Hundreds",
            "text": "Pattern: Number + រយ (roy = hundred)\n• 100 = មួយរយ (one hundred)\n• 500 = ប្រាំរយ (five hundred)"
        }
    },
    {"type": "vocab_card",
     "data": {"front": "100 — One hundred", "back": "មួយរយ", "pronunciation": "Mouy Roy", "audio": "100.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "200 — Two hundred", "back": "ពីររយ", "pronunciation": "Pii Roy", "audio": "200.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "300 — Three hundred", "back": "បីរយ", "pronunciation": "Bei Roy", "audio": "300.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "500 — Five hundred", "back": "ប្រាំរយ", "pronunciation": "Pram Roy", "audio": "500.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "900 — Nine hundred", "back": "ប្រាំបួនរយ", "pronunciation": "Pram-Buan Roy",
              "audio": "900.mp3"}},

    # ============================================
    # БЛОК 8: ТЫСЯЧИ (1,000...)
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 8: Thousands",
            "text": "Pattern: Number + ពាន់ (poan = thousand)\n• 1,000 = មួយពាន់\n• 5,000 = ប្រាំពាន់"
        }
    },
    {"type": "vocab_card",
     "data": {"front": "1,000 — One thousand", "back": "មួយពាន់", "pronunciation": "Mouy Poan", "audio": "1000.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "2,000 — Two thousand", "back": "ពីរពាន់", "pronunciation": "Pii Poan", "audio": "2000.mp3"}},
    {"type": "vocab_card", "data": {"front": "5,000 — Five thousand", "back": "ប្រាំពាន់", "pronunciation": "Pram Poan",
                                    "audio": "5000.mp3"}},

    # ============================================
    # БЛОК 9: ДЕСЯТКИ ТЫСЯЧ (10,000...)
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 9: Ten Thousands",
            "text": "Pattern: Number + ម៉ឺន (meun = 10,000)\n• 10,000 = មួយម៉ឺន\n• 20,000 = ពីរម៉ឺន"
        }
    },
    {"type": "vocab_card",
     "data": {"front": "10,000 — Ten thousand", "back": "មួយម៉ឺន", "pronunciation": "Mouy Meun", "audio": "10000.mp3"}},
    {"type": "vocab_card", "data": {"front": "20,000 — Twenty thousand", "back": "ពីរម៉ឺន", "pronunciation": "Pii Meun",
                                    "audio": "20000.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "50,000 — Fifty thousand", "back": "ប្រាំម៉ឺន", "pronunciation": "Pram Meun",
              "audio": "50000.mp3"}},

    # ============================================
    # БЛОК 10: СЛОЖНЫЕ ЧИСЛА
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 10: Complex Numbers",
            "text": "Build from LARGEST to SMALLEST unit:\n1,234 = 1000 + 200 + 30 + 4\n→ មួយពាន់ពីររយសាមសិបបួន"
        }
    },
    {"type": "vocab_card",
     "data": {"front": "1,234", "back": "មួយពាន់ពីររយសាមសិបបួន", "pronunciation": "Mouy Poan Pii Roy Sam-Sep Buan",
              "audio": "1234.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "5,678", "back": "ប្រាំពាន់ហុកសិបប្រាំបី", "pronunciation": "Pram Poan Hok-Sep Pram-Bei",
              "audio": "5678.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "25,500", "back": "ពីរម៉ឺនប្រាំពាន់ប្រាំរយ", "pronunciation": "Pii Meun Pram Poan Pram Roy",
              "audio": "25500.mp3"}},

    {
        "type": "quiz",
        "data": {
            "question": "Break down 25,500: 20k + 5k + 500. What is it?",
            "options": [
                "ពីរម៉ឺនប្រាំពាន់ប្រាំរយ (Pii Meun Pram Poan Pram Roy)",
                "ពីរម៉ឺនប្រាំរយ (Pii Meun Pram Roy)",
                "ប្រាំម៉ឺនពីរពាន់ (Pram Meun Pii Poan)"
            ],
            "correct_answer": "ពីរម៉ឺនប្រាំពាន់ប្រាំរយ (Pii Meun Pram Poan Pram Roy)",
            "explanation": "ពីរម៉ឺន (20k) + ប្រាំពាន់ (5k) + ប្រាំរយ (500)",
            "audio_map": {
                "ពីរម៉ឺនប្រាំពាន់ប្រាំរយ (Pii Meun Pram Poan Pram Roy)": "25500.mp3"
            }
        }
    },

    # ============================================
    # БЛОК 11: ДЕНЬГИ — БАЗОВЫЕ СЛОВА
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 11: Money Basics",
            "text": "Essential market vocabulary:\n• Dollar = ដុល្លារ\n• Riel = រៀល (Cambodian currency)\n• Half = កន្លះ (0.5)"
        }
    },
    {"type": "vocab_card",
     "data": {"front": "Dollar", "back": "ដុល្លារ", "pronunciation": "Dol-la", "audio": "dollar.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "Riel (currency)", "back": "រៀល", "pronunciation": "Riel", "audio": "riel.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "Half (0.5)", "back": "កន្លះ", "pronunciation": "Kanh-lah", "audio": "half.mp3"}},

    # ============================================
    # БЛОК 12: ДЕНЬГИ — ПРОСТЫЕ ЦЕНЫ
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 12: Simple Prices",
            "text": "Pattern: Number + Dollar + (Half)\n• $1 = មួយដុល្លារ\n• $1.50 = មួយដុល្លារកន្លះ"
        }
    },
    {"type": "vocab_card", "data": {"front": "$0.50", "back": "កន្លះដុល្លារ", "pronunciation": "Kanh-lah Dol-la",
                                    "audio": "0_50_dollar.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "$1", "back": "មួយដុល្លារ", "pronunciation": "Mouy Dol-la", "audio": "1_dollar.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "$1.50", "back": "មួយដុល្លារកន្លះ", "pronunciation": "Mouy Dol-la Kanh-lah",
              "audio": "1_50_dollar.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "$2", "back": "ពីរដុល្លារ", "pronunciation": "Pii Dol-la", "audio": "2_dollar.mp3"}},
    {"type": "vocab_card", "data": {"front": "$2.50", "back": "ពីរដុល្លារកន្លះ", "pronunciation": "Pii Dol-la Kanh-lah",
                                    "audio": "2_50_dollar.mp3"}},

    # ============================================
    # БЛОК 13: ДЕНЬГИ — ТИПИЧНЫЕ СУММЫ
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "Step 13: Common Amounts",
            "text": "Practice typical prices you'll use at markets."
        }
    },
    {"type": "vocab_card",
     "data": {"front": "$5", "back": "ប្រាំដុល្លារ", "pronunciation": "Pram Dol-la", "audio": "5_dollar.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "$10", "back": "ដប់ដុល្លារ", "pronunciation": "Dop Dol-la", "audio": "10_dollar.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "$20", "back": "ម្ភៃដុល្លារ", "pronunciation": "Ma-Phei Dol-la", "audio": "20_dollar.mp3"}},
    {"type": "vocab_card", "data": {"front": "$25", "back": "ម្ភៃប្រាំដុល្លារ", "pronunciation": "Ma-Phei-Pram Dol-la",
                                    "audio": "25_dollar.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "$50", "back": "ហាសិបដុល្លារ", "pronunciation": "Ha-Sep Dol-la", "audio": "50_dollar.mp3"}},
    {"type": "vocab_card",
     "data": {"front": "$100", "back": "មួយរយដុល្លារ", "pronunciation": "Mouy Roy Dol-la", "audio": "100_dollar.mp3"}},

    {
        "type": "quiz",
        "data": {
            "question": "Coffee costs $2.50. How do you say it?",
            "options": [
                "ពីរដុល្លារកន្លះ (Pii Dol-la Kanh-lah)",
                "ពីរកន្លះដុល្លារ (Pii Kanh-lah Dol-la)",
                "កន្លះពីរដុល្លារ (Kanh-lah Pii Dol-la)"
            ],
            "correct_answer": "ពីរដុល្លារកន្លះ (Pii Dol-la Kanh-lah)",
            "explanation": "Pattern: Number + Dollar + Half → ពីរ + ដុល្លារ + កន្លះ",
            "audio_map": {
                "ពីរដុល្លារកន្លះ (Pii Dol-la Kanh-lah)": "2_50_dollar.mp3"
            }
        }
    },

    # ============================================
    # ФИНАЛЬНЫЕ ТЕСТЫ
    # ============================================
    {
        "type": "theory",
        "data": {
            "title": "🎓 Final Challenge",
            "text": "You've learned the complete system! Test everything you know."
        }
    },
    {
        "type": "quiz",
        "data": {
            "question": "What is 47?",
            "options": [
                "សែសិបប្រាំពីរ (Sae-Sep-Pram-Pii)",
                "បួនសិបចិត (Buan-Sep-Chet)",
                "ប្រាំបួនដប់ (Pram-Buan-Dop)"
            ],
            "correct_answer": "សែសិបប្រាំពីរ (Sae-Sep-Pram-Pii)",
            "explanation": "47 = 40 (សែសិប) + 7 (ប្រាំពីរ)",
            "audio_map": {"សែសិបប្រាំពីរ (Sae-Sep-Pram-Pii)": "47.mp3"}
        }
    },
    {
        "type": "quiz",
        "data": {
            "question": "How much is $25?",
            "options": [
                "ម្ភៃប្រាំដុល្លារ (Ma-Phei-Pram Dol-la)",
                "ពីរប្រាំដុល្លារ (Pii-Pram Dol-la)",
                "ដប់ប្រាំដុល្លារ (Dop-Pram Dol-la)"
            ],
            "correct_answer": "ម្ភៃប្រាំដុល្លារ (Ma-Phei-Pram Dol-la)",
            "explanation": "25 (ម្ភៃប្រាំ) + Dollar (ដុល្លារ)",
            "audio_map": {"ម្ភៃប្រាំដុល្លារ (Ma-Phei-Pram Dol-la)": "25_dollar.mp3"}
        }
    }
]


async def generate_single_audio(text, filename):
    filepath = AUDIO_OUTPUT_DIR / filename
    if filepath.exists() and not FORCE_UPDATE_AUDIO: return
    try:
        # Очищаем текст от латиницы перед генерацией
        clean_text = "".join([c for c in text.split('(')[0] if ord(c) > 128 or c.isspace()]).strip()
        if not clean_text: return
        await edge_tts.Communicate(clean_text, VOICE, rate=SPEED).save(filepath)
        print(f"   ✅ Generated: {filename}")
    except Exception as e:
        print(f"❌ Error {filename}: {e}")


async def seed_lesson():
    TARGET_ID = 3  # Наш целевой ID для Чисел
    print(f"🚀 Seeding Lesson ID {TARGET_ID}...")

    # 1. Синхронизируем заголовок в таблице lessons
    supabase.table("lessons").update({
        "title": LESSON_TITLE,
        "module_id": 1,
        "order_index": 2
    }).eq("id", TARGET_ID).execute()

    # 2. Подготовка словаря и аудио-задач
    vocabulary = []
    audio_tasks = []
    items_to_insert = []

    for index, item in enumerate(CONTENT):
        db_data = item["data"].copy()

        if item["type"] == "vocab_card":
            vocabulary.append({
                "khmer": db_data["back"],
                "english": db_data["front"],
                "pronunciation": db_data["pronunciation"],
                "audio": db_data.get("audio")
            })
            if "audio" in db_data:
                audio_tasks.append(generate_single_audio(db_data["back"], db_data["audio"]))

        if item["type"] == "quiz" and "audio_map" in db_data:
            for text_key, filename in db_data["audio_map"].items():
                audio_tasks.append(generate_single_audio(text_key, filename))

        items_to_insert.append({
            "lesson_id": TARGET_ID,
            "type": item["type"],
            "order_index": index,
            "data": db_data
        })

    # 3. Обновляем Vocabulary в основной таблице
    supabase.table("lessons").update({"vocabulary": vocabulary}).eq("id", TARGET_ID).execute()

    # 4. Перезаписываем элементы урока
    supabase.table("lesson_items").delete().eq("lesson_id", TARGET_ID).execute()

    # 5. Генерируем аудио
    if audio_tasks:
        await asyncio.gather(*audio_tasks)

    # 6. Загружаем в БД
    supabase.table("lesson_items").insert(items_to_insert).execute()
    print(f"✅ SUCCESS! Lesson 3 (Money & Numbers) is fully populated.")


if __name__ == "__main__":
    asyncio.run(seed_lesson())