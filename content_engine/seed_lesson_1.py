import asyncio
from content_engine.glyph_data import get_glyph_data
from database_engine import seed_lesson, update_study_materials

# Настраиваем целевую букву для Урока 1.1
TARGET_CHAR = "ស"
CHAR_DATA = get_glyph_data(TARGET_CHAR)

CHAPTER_1_DATA = {
    101: {
        "title": "Lesson 1.1: Hello",
        "desc": "Greeting basics.",
        "module_id": 1,
        "order_index": 0,
        "content": [
            {"type": "theory", "data": {"title": "The Alphabet",
                                        "text": "Khmer consonants are divided into two series: A-Series (Light) and O-Series (Deep). This affects pronunciation."}},

            {"type": "vocab_card",
             "data": {"front": "Hello", "back": "សួស្តី", "pronunciation": "Suəs-dey", "audio": "hello.mp3"}},

            # VISUAL DECODER: PURE MODE
            {
                "type": "visual_decoder",
                "data": {
                    "word": "សួស្តី",
                    "target_char": TARGET_CHAR,

                    # Минималистичная подсказка
                    "hint": f"Find character: {CHAR_DATA['sound']}",
                    "english_translation": "Hello (Suas-dey)",

                    # Данные для движка
                    "letter_audio": CHAR_DATA["audio"],
                    "letter_series": CHAR_DATA["series"],
                    "word_audio": "hello.mp3"
                }
            },

            {"type": "vocab_card",
             "data": {"front": "Hello (Formal)", "back": "ជំរាបសួរ", "pronunciation": "Cum-riəp Suə"}},
            {"type": "vocab_card", "data": {"front": "I / Me", "back": "ខ្ញុំ", "pronunciation": "Kɲom"}},
            {"type": "vocab_card", "data": {"front": "You", "back": "អ្នក", "pronunciation": "Neak"}},
            {"type": "quiz",
             "data": {"question": "Informal Hello?", "options": ["សួស្តី", "ជំរាបសួរ"], "correct_answer": "សួស្តី"}}
        ]
    }
}


async def main():
    print("🌟 Запуск Pure Visual Decoder...")
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(
            lesson_id, info["title"], info["desc"], info["content"],
            module_id=info["module_id"], order_index=info["order_index"]
        )
    await update_study_materials(1, CHAPTER_1_DATA)
    print("🚀 База данных обновлена.")


if __name__ == "__main__":
    asyncio.run(main())