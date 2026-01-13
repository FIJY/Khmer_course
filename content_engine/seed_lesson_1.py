import asyncio
from database_engine import seed_lesson

# ==========================================
# 1. ДАННЫЕ УРОКОВ (Без саммари в конце)
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
            # ЗДЕСЬ БОЛЬШЕ НЕТ САММАРИ
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
            # ЗДЕСЬ БОЛЬШЕ НЕТ САММАРИ
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
            # ЗДЕСЬ БОЛЬШЕ НЕТ САММАРИ
        ]
    }
}


# ==========================================
# 2. СБОРЩИК СПИСКА (Скучный текст)
# ==========================================

def generate_text_guidebook(all_lessons):
    """
    Собирает все слова в один длинный текстовый список.
    """
    print("📝 Generating Text-Only Guidebook...")

    # 1. Собираем текст
    full_text = "CHAPTER 1 VOCABULARY\n\n"

    for lid, lesson in all_lessons.items():
        # Заголовок подурока
        full_text += f"--- {lesson['title']} ---\n"

        # Правила (коротко)
        for item in lesson['content']:
            if item['type'] == 'theory':
                full_text += f"💡 {item['data']['title']}: {item['data']['text']}\n"

        # Слова (списком)
        for item in lesson['content']:
            if item['type'] == 'vocab_card':
                khmer = item['data']['back']
                eng = item['data']['front']
                pron = item['data']['pronunciation']
                # Формат строки списка
                full_text += f"• {khmer} ({pron}) — {eng}\n"

        full_text += "\n"  # Отступ между уроками

    # 2. Упаковываем в ОДНУ карточку
    guidebook_content = [{
        "type": "theory",
        "data": {
            "title": "📖 Full Word List",
            "text": full_text
        }
    }]

    return guidebook_content


# ==========================================
# 3. ЗАПУСК
# ==========================================

async def main():
    # 1. Заливаем уроки (без хвостов)
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])

    # 2. Заливаем Скучный Список (ID 100)
    text_content = generate_text_guidebook(CHAPTER_1_DATA)
    await seed_lesson(100, "Chapter 1 Reference", "Reference list.", text_content)

    print("🚀 Done. Lessons are clean, Guidebook is a list.")


if __name__ == "__main__":
    asyncio.run(main())