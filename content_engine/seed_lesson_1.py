import asyncio
from database_engine import seed_lesson, supabase

# ==========================================
# 1. ЧИСТЫЕ УРОКИ (Для прохождения)
# ==========================================
CHAPTER_1_DATA = {
    101: {
        "title": "Lesson 1.1: Hello",
        "desc": "Basics of greeting.",
        "content": [
            {"type": "theory", "data": {"title": "Components", "text": "Khmer words are built from smaller parts."}},
            {"type": "vocab_card", "data": {"front": "Hello (Friends)", "back": "សួស្តី", "pronunciation": "Suəs-dey",
                                            "context": "Informal."}},
            {"type": "vocab_card",
             "data": {"front": "Hello (Formal)", "back": "ជំរាបសួរ", "pronunciation": "Cum-riəp Suə",
                      "context": "Formal."}},
            {"type": "vocab_card",
             "data": {"front": "I / Me", "back": "ខ្ញុំ", "pronunciation": "Kɲom", "context": "Universal."}},
            {"type": "vocab_card",
             "data": {"front": "You", "back": "អ្នក", "pronunciation": "Neak", "context": "Polite."}},
            {"type": "quiz",
             "data": {"question": "Informal Hello?", "options": ["សួស្តី", "ជំរាបសួរ"], "correct_answer": "សួស្តី"}}
        ]
    },
    102: {
        "title": "Lesson 1.2: Manners",
        "desc": "Polite particles.",
        "content": [
            {"type": "theory", "data": {"title": "Politeness", "text": "Men say Baat. Women say Jaa."}},
            {"type": "vocab_card",
             "data": {"front": "Thank you", "back": "អរគុណ", "pronunciation": "Arkun", "context": "Gratitude."}},
            {"type": "vocab_card",
             "data": {"front": "Sorry", "back": "សូមទោស", "pronunciation": "Soum Toh", "context": "Apology."}},
            {"type": "quiz",
             "data": {"question": "Thanks?", "options": ["Arkun", "Soum Toh"], "correct_answer": "Arkun"}}
        ]
    },
    103: {
        "title": "Lesson 1.3: Yes/No",
        "desc": "Negation.",
        "content": [
            {"type": "theory", "data": {"title": "Negation", "text": "Format: Mɨn + Verb + Te."}},
            {"type": "vocab_card",
             "data": {"front": "Yes (M)", "back": "បាទ", "pronunciation": "Baat", "context": "Male."}},
            {"type": "vocab_card",
             "data": {"front": "Yes (F)", "back": "ចាស", "pronunciation": "Jaa", "context": "Female."}},
            {"type": "vocab_card",
             "data": {"front": "No", "back": "ទេ", "pronunciation": "Te", "context": "Particle."}},
            {"type": "quiz", "data": {"question": "Male Yes?", "options": ["Baat", "Jaa"], "correct_answer": "Baat"}}
        ]
    }
}


# ==========================================
# 2. ГЕНЕРАТОР ШПАРГАЛКИ (Для кнопки "Книжечка")
# ==========================================

def generate_simple_list(all_lessons):
    """
    Собирает простой текстовый список для справочника.
    """
    print("📜 Generating Text List for Book Icon...")

    # Формируем Markdown текст
    full_text = "# Chapter 1 Vocabulary\n\n"

    for lid, lesson in all_lessons.items():
        # Заголовок раздела
        full_text += f"## {lesson['title']}\n"

        # Список слов
        for item in lesson['content']:
            if item['type'] == 'vocab_card':
                khmer = item['data']['back']
                eng = item['data']['front']
                pron = item['data']['pronunciation']
                # Строка: Кхмерский (Произношение) - Перевод
                full_text += f"* **{khmer}** ({pron}) — {eng}\n"

        full_text += "\n"

    # Упаковываем в одну карточку Theory
    guidebook_content = [{
        "type": "theory",
        "data": {
            "title": "Reference List",
            "text": "All words from this chapter.",
            "markdown": full_text
        }
    }]

    return guidebook_content


# ==========================================
# 3. ЗАПУСК
# ==========================================

async def main():
    print("🌟 Syncing Lessons 101-103 (Clean)...")
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])

    print("📘 Syncing Lesson 100 (Required for Book Icon)...")
    guidebook_items = generate_simple_list(CHAPTER_1_DATA)

    # Мы обязаны создать этот урок, иначе кнопка выдает ошибку
    await seed_lesson(
        100,
        "Chapter 1 Summary",
        "Reference material.",
        guidebook_items
    )

    print("🚀 Done! Lessons are clean. Book Icon has data.")


if __name__ == "__main__":
    asyncio.run(main())