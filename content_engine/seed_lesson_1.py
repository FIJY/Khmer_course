import asyncio
from database_engine import seed_lesson, supabase

# ==========================================
# 1. ДАННЫЕ УРОКОВ (Оставляем чистыми)
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
# 2. ГЕНЕРАТОР "СКУЧНОГО СПИСКА" (Для Урока 100)
# ==========================================

def generate_full_guidebook(all_lessons):
    """
    Собирает всё в одну большую текстовую 'простыню'.
    """
    print("📜 Generating Master Cheat Sheet...")

    # Заголовок (Markdown)
    full_text = "# Chapter 1 Vocabulary & Rules\n\n"

    for lid, lesson in all_lessons.items():
        # Добавляем разделитель
        full_text += f"## {lesson['title']}\n"

        # 1. Сначала правила этого урока
        theory_text = ""
        for item in lesson['content']:
            if item['type'] == 'theory':
                theory_text += f"* 💡 **{item['data']['title']}**: {item['data']['text']}\n"

        if theory_text:
            full_text += "### Grammar\n" + theory_text + "\n"

        # 2. Потом слова этого урока
        vocab_text = ""
        for item in lesson['content']:
            if item['type'] == 'vocab_card':
                khmer = item['data']['back']
                eng = item['data']['front']
                pron = item['data']['pronunciation']
                # Формат: • Слово (Произношение) - Перевод
                vocab_text += f"* **{khmer}** ({pron}) — {eng}\n"

        if vocab_text:
            full_text += "### Words\n" + vocab_text + "\n"

        full_text += "---\n\n"

    # Создаем ОДНУ карточку 'theory', в которой лежит весь этот текст
    guidebook_content = [{
        "type": "theory",
        "data": {
            "title": "Full Summary",  # Заголовок карточки
            "text": "Scroll down to see all words.",  # Подзаголовок
            "markdown": full_text  # Основной текст (React должен уметь рендерить Markdown)
        }
    }]

    return guidebook_content


# ==========================================
# 3. ЗАПУСК
# ==========================================

async def main():
    print("🌟 Syncing Chapter 1 Lessons...")

    # 1. Заливаем уроки (101-103)
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])

    # 2. ВОЗВРАЩАЕМ Урок 100 (Guidebook), но с новым наполнением
    # Без него кнопка пишет "No study materials"
    print("📘 Restoring Guidebook Source (Lesson 100)...")
    guidebook_items = generate_full_guidebook(CHAPTER_1_DATA)

    await seed_lesson(
        100,
        "Guidebook",  # Название
        "Cheat sheet for Chapter 1",
        guidebook_items
    )

    print("🚀 Done! The 'Book Icon' should now show the list again.")


if __name__ == "__main__":
    asyncio.run(main())