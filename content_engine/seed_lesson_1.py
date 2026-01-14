import asyncio
from database_engine import seed_lesson, update_study_materials

# КОНФИГУРАЦИЯ УРОКА 1.1 (PURE VISUAL DECODER)
CHAPTER_1_DATA = {
    101: {
        "title": "Lesson 1.1: Hello",
        "desc": "Greeting basics.",
        "module_id": 1,
        "order_index": 0,
        "content": [
            # 1. ТЕОРИЯ
            {"type": "theory", "data": {"title": "The Alphabet",
                                        "text": "Khmer consonants are divided into two series: A-Series (Sun ☀️) and O-Series (Moon 🌙). This changes how vowels sound!"}},

            # 2. СЛОВО (С новым аудио)
            {"type": "vocab_card",
             "data": {"front": "Hello", "back": "សួស្តី", "pronunciation": "Suəs-dey", "audio": "hello.mp3"}},

            # 3. VISUAL DECODER (Настраиваем на сгенерированные файлы)
            {
                "type": "visual_decoder",
                "data": {
                    "word": "សួស្តី",
                    "target_char": "ស",  # Ищем букву Sa

                    "hint": "Find character: Sa (Series 1)",
                    "english_translation": "Hello (Suas-dey)",

                    # ССЫЛКИ НА ФАЙЛЫ, КОТОРЫЕ ТЫ СГЕНЕРИРОВАЛА
                    "letter_audio": "letter_sa.mp3",
                    "letter_series": 1,
                    "word_audio": "hello.mp3"
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
    # (Остальные уроки 102 и 103 пока можно оставить как есть или обновить аудио позже)
}


async def main():
    print("🌟 Обновляю Урок 1.1 с новой озвучкой...")
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(
            lesson_id, info["title"], info["desc"], info["content"],
            module_id=info["module_id"], order_index=info["order_index"]
        )
    await update_study_materials(1, CHAPTER_1_DATA)
    print("🚀 Урок обновлен! Проверяй в браузере.")


if __name__ == "__main__":
    asyncio.run(main())