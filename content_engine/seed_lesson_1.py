import asyncio
from database_engine import seed_lesson

# 1. ДАННЫЕ УРОКОВ (101, 102, 103)
CHAPTER_1_DATA = {
    101: {
        "title": "Lesson 1.1: Hello",
        "desc": "Basics of greeting.",
        "content": [
            {"type": "theory", "data": {"title": "Components", "text": "Khmer words are built from smaller parts."}},
            {"type": "vocab_card", "data": {"front": "Hello (Friends)", "back": "សួស្តី", "pronunciation": "Suəs-dey"}},
            {"type": "vocab_card", "data": {"front": "I / Me", "back": "ខ្ញុំ", "pronunciation": "Kɲom"}},
            {"type": "quiz",
             "data": {"question": "Informal Hello?", "options": ["សួស្តី", "ជំរាបសួរ"], "correct_answer": "សួស្តី"}}
        ]
    },
    102: {
        "title": "Lesson 1.2: Manners",
        "desc": "Polite particles.",
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
        "content": [
            {"type": "theory", "data": {"title": "Negation", "text": "Format: Mɨn + Verb + Te."}},
            {"type": "vocab_card", "data": {"front": "Yes (M)", "back": "បាទ", "pronunciation": "Baat"}},
            {"type": "vocab_card", "data": {"front": "No", "back": "ទេ", "pronunciation": "Te"}},
            {"type": "quiz", "data": {"question": "Male Yes?", "options": ["Baat", "Jaa"], "correct_answer": "Baat"}}
        ]
    }
}


# 2. ФУНКЦИЯ СБОРА СВОДКИ (Для книжечки)
def generate_chapter_summary(all_lessons):
    summary_items = []
    # Заголовок
    summary_items.append({"type": "theory", "data": {"title": "Chapter 1 Summary",
                                                     "text": "Everything you learned in Greetings & Politeness."}})

    for lid, lesson in all_lessons.items():
        # Добавляем теорию из каждого урока
        for item in lesson['content']:
            if item['type'] == 'theory':
                summary_items.append(item)
        # Добавляем все слова из каждого урока
        for item in lesson['content']:
            if item['type'] == 'vocab_card':
                summary_items.append(item)

    return summary_items


async def main():
    print("🌟 Syncing Lessons 101-103...")
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])

    print("📘 Filling the Book Icon (Lesson 1)...")
    # Собираем данные для книжки (ID главы = 1)
    summary_content = generate_chapter_summary(CHAPTER_1_DATA)

    await seed_lesson(
        1,
        "Greetings & Politeness",
        "Full summary of the chapter.",
        summary_content
    )

    print("🚀 Done! Lesson 1 is now the source for your Book Icon.")


if __name__ == "__main__":
    asyncio.run(main())