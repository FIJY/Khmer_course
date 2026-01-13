import asyncio
from database_engine import seed_lesson, update_study_materials

# ДАННЫЕ УРОКОВ ГЛАВЫ 1
CHAPTER_1_DATA = {
    101: {
        "title": "Lesson 1.1: Hello",
        "desc": "Basics of greeting.",
        "module_id": 1,
        "order_index": 0,
        "content": [
            # 1. Теория
            {"type": "theory", "data": {"title": "Components", "text": "Khmer words are built from smaller parts."}},

            # 2. Карточка "Привет"
            {"type": "vocab_card",
             "data": {"front": "Hello (Friends)", "back": "សួស្តី", "pronunciation": "Suəs-dey", "audio": "hello.mp3"}},

            # --- НОВЫЙ БЛОК: VISUAL DECODER (Охота на букву) ---
            {
                "type": "visual_decoder",
                "data": {
                    "word": "សួស្តី",  # В каком слове ищем
                    "target_char": "ស",  # Какую букву ищем (Sa)
                    "family_icon": "🥣",  # Иконка семьи (Чаша)
                    "hint": "Find the Bowl letter (Sa) inside Hello!",
                    "english_translation": "Hello (Suas-dey)",
                    "audio": "hello.mp3"  # Аудио файл слова
                }
            },
            # ---------------------------------------------------

            {"type": "vocab_card",
             "data": {"front": "Hello (Formal)", "back": "ជំរាបសួរ", "pronunciation": "Cum-riəp Suə"}},
            {"type": "vocab_card", "data": {"front": "I / Me", "back": "ខ្ញុំ", "pronunciation": "Kɲom"}},
            {"type": "vocab_card", "data": {"front": "You", "back": "អ្នក", "pronunciation": "Neak"}},
            {"type": "quiz",
             "data": {"question": "Informal Hello?", "options": ["សួស្តី", "ជំរាបសួរ"], "correct_answer": "សួស្តី"}}
        ]
    },
    102: {
        "title": "Lesson 1.2: Manners",
        "desc": "Polite particles.",
        "module_id": 1,
        "order_index": 1,
        "content": [
            {"type": "theory", "data": {"title": "Politeness", "text": "Men say Baat. Women say Jaa."}},
            {"type": "vocab_card", "data": {"front": "Thank you", "back": "អរគុណ", "pronunciation": "Arkun"}},
            {"type": "vocab_card", "data": {"front": "Sorry", "back": "សូមទោស", "pronunciation": "Soum Toh"}},
            {"type": "quiz",
             "data": {"question": "Thanks?", "options": ["Arkun", "Soum Toh"], "correct_answer": "Arkun"}}
        ]
    },
    103: {
        "title": "Lesson 1.3: Yes/No",
        "desc": "Negation.",
        "module_id": 1,
        "order_index": 2,
        "content": [
            {"type": "theory", "data": {"title": "Negation", "text": "Format: Mɨn + Verb + Te."}},
            {"type": "vocab_card", "data": {"front": "Yes (M)", "back": "បាទ", "pronunciation": "Baat"}},
            {"type": "vocab_card", "data": {"front": "Yes (F)", "back": "ចាស", "pronunciation": "Jaa"}},
            {"type": "vocab_card", "data": {"front": "No", "back": "ទេ", "pronunciation": "Te"}},
            {"type": "vocab_card", "data": {"front": "I am NOT fine", "back": "ខ្ញុំមិនសុខសប្បាយទេ",
                                            "pronunciation": "Knhom min sok-sabay te"}},
            {"type": "quiz", "data": {"question": "Male Yes?", "options": ["Baat", "Jaa"], "correct_answer": "Baat"}}
        ]
    }
}


async def main():
    print("🌟 Запуск генерации Уроков для Главы 1...")

    # 1. Заливаем уроки
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(
            lesson_id,
            info["title"],
            info["desc"],
            info["content"],
            module_id=info["module_id"],
            order_index=info["order_index"]
        )

    # 2. Обновляем Книжечку
    await update_study_materials(1, CHAPTER_1_DATA)

    print("🚀 Все готово! Уроки на карте, книжечка обновлена.")


if __name__ == "__main__":
    asyncio.run(main())