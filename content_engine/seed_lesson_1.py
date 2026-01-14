import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Импортируем функции записи (которые ты уже написала ранее)
from database_engine import seed_lesson, update_study_materials

# --- НАСТРОЙКА SUPABASE (Для чтения алфавита) ---
load_dotenv()
url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)


# --- ЛОГИКА: ПОЛУЧЕНИЕ КАРТЫ ЗВУКОВ ИЗ БАЗЫ ---
async def fetch_global_audio_map():
    print("📡 Скачиваю полную карту звуков из таблицы 'alphabet'...")
    try:
        # Берем только ID (букву) и AUDIO_URL
        response = supabase.table('alphabet').select('id, audio_url').execute()

        # Превращаем в словарь: { "ស": "letter_sa.mp3", "ា": "vowel_aa.mp3" ... }
        # Фильтруем, чтобы не брать пустые audio_url
        audio_map = {
            row['id']: row['audio_url']
            for row in response.data
            if row['audio_url']
        }
        print(f"✅ Загружено {len(audio_map)} звуков.")
        return audio_map
    except Exception as e:
        print(f"❌ Ошибка чтения алфавита: {e}")
        return {}


def build_word_map(word, global_map):
    """Собирает мини-карту звуков только для букв этого слова"""
    mapping = {}
    for char in word:
        if char in global_map:
            mapping[char] = global_map[char]
    return mapping


# --- КОНТЕНТ УРОКОВ (Теперь это функция, принимающая карту) ---
def get_chapter_data(global_audio_map):
    return {
        # ------------------------------------------------------------------
        # LESSON 1.1: HELLO
        # ------------------------------------------------------------------
        101: {
            "title": "Lesson 1.1: Hello",
            "desc": "Greeting basics & The First Letter.",
            "module_id": 1,
            "order_index": 0,
            "content": [
                {"type": "theory", "data": {"title": "The Alphabet",
                                            "text": "Khmer consonants are divided into two series: A-Series (Sun ☀️) and O-Series (Moon 🌙)."}},
                {"type": "vocab_card",
                 "data": {"front": "Hello", "back": "សួស្តី", "pronunciation": "Suəs-dey", "audio": "hello.mp3"}},

                # VISUAL DECODER
                {
                    "type": "visual_decoder",
                    "data": {
                        "word": "សួស្តី",
                        "target_char": "ស",
                        "hint": "Find character: Sa (Series 1)",
                        "english_translation": "Hello (Suas-dey)",
                        "letter_series": 1,
                        "word_audio": "hello.mp3",
                        # ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ КАРТЫ
                        "char_audio_map": build_word_map("សួស្តី", global_audio_map)
                    }
                },
                {"type": "vocab_card",
                 "data": {"front": "Hello (Formal)", "back": "ជំរាបសួរ", "pronunciation": "Cum-riəp Suə",
                          "audio": "hello_formal.mp3"}},
                {"type": "vocab_card",
                 "data": {"front": "I / Me", "back": "ខ្ញុំ", "pronunciation": "Kɲom", "audio": "i_me.mp3"}},
                {"type": "vocab_card",
                 "data": {"front": "You", "back": "អ្នក", "pronunciation": "Neak", "audio": "you.mp3"}},
                {"type": "quiz",
                 "data": {"question": "Informal Hello?", "options": ["សួស្តី", "ជំរាបសួរ"], "correct_answer": "សួស្តី"}}
            ]
        },

        # ------------------------------------------------------------------
        # LESSON 1.2: MANNERS
        # ------------------------------------------------------------------
        102: {
            "title": "Lesson 1.2: Manners",
            "desc": "Being polite & The 'House' Letter.",
            "module_id": 1,
            "order_index": 1,
            "content": [
                {"type": "theory", "data": {"title": "Politeness",
                                            "text": "To be polite, men add 'Baat' and women add 'Jaa' at the end of sentences."}},
                {"type": "vocab_card",
                 "data": {"front": "Thank you", "back": "អរគុណ", "pronunciation": "Arkun", "audio": "thank_you.mp3"}},

                # VISUAL DECODER
                {
                    "type": "visual_decoder",
                    "data": {
                        "word": "អរគុណ",
                        "target_char": "ក",
                        "hint": "Find character: Ka (Series 1)",
                        "english_translation": "Thank You (Arkun)",
                        "letter_series": 1,
                        "word_audio": "thank_you.mp3",
                        "char_audio_map": build_word_map("អរគុណ", global_audio_map)
                    }
                },
                {"type": "vocab_card",
                 "data": {"front": "Sorry", "back": "សូមទោស", "pronunciation": "Soum Toh", "audio": "sorry.mp3"}},
                {"type": "quiz", "data": {"question": "How to say Thank You?", "options": ["អរគុណ", "សូមទោស"],
                                          "correct_answer": "អរគុណ"}}
            ]
        },

        # ------------------------------------------------------------------
        # LESSON 1.3: YES & NO
        # ------------------------------------------------------------------
        103: {
            "title": "Lesson 1.3: Yes / No",
            "desc": "Agreement & The 'Bucket' Letter.",
            "module_id": 1,
            "order_index": 2,
            "content": [
                {"type": "theory", "data": {"title": "Negation",
                                            "text": "To say NO, put 'Min' before the verb and 'Te' after. Example: Min...Te."}},

                # VISUAL DECODER
                {
                    "type": "visual_decoder",
                    "data": {
                        "word": "បាទ",
                        "target_char": "ប",
                        "hint": "Find character: Ba (Series 1)",
                        "english_translation": "Yes (Male)",
                        "letter_series": 1,
                        "word_audio": "yes_male.mp3",
                        "char_audio_map": build_word_map("បាទ", global_audio_map)
                    }
                },
                {"type": "vocab_card",
                 "data": {"front": "Yes (Male)", "back": "បាទ", "pronunciation": "Baat", "audio": "yes_male.mp3"}},
                {"type": "vocab_card",
                 "data": {"front": "Yes (Female)", "back": "ចាស", "pronunciation": "Jaa", "audio": "yes_female.mp3"}},
                {"type": "vocab_card", "data": {"front": "No", "back": "ទេ", "pronunciation": "Te", "audio": "no.mp3"}},
                {"type": "vocab_card", "data": {"front": "I am NOT fine", "back": "ខ្ញុំមិនសុខសប្បាយទេ",
                                                "pronunciation": "Knhom min sok-sabay te", "audio": "not_fine.mp3"}},
                {"type": "quiz",
                 "data": {"question": "Yes (for men)?", "options": ["បាទ", "ចាស"], "correct_answer": "បាទ"}}
            ]
        }
    }


async def main():
    # 1. Сначала загружаем "знания" (карту звуков) из базы
    global_map = await fetch_global_audio_map()

    if not global_map:
        print("⚠️ Внимание! Карта звуков пуста. Убедись, что таблица 'alphabet' заполнена.")

    # 2. Формируем уроки, используя полученные знания
    chapter_data = get_chapter_data(global_map)

    print("🌟 Обновляю уроки (используя динамические данные из базы)...")
    for lesson_id, info in chapter_data.items():
        await seed_lesson(
            lesson_id, info["title"], info["desc"], info["content"],
            module_id=info["module_id"], order_index=info["order_index"]
        )
    await update_study_materials(1, chapter_data)
    print("🚀 Уроки успешно обновлены!")


if __name__ == "__main__":
    asyncio.run(main())