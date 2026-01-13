import asyncio
from database_engine import seed_lesson

# ==========================================
# 1. ИСХОДНЫЕ ДАННЫЕ (Уроки)
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
            {"type": "theory", "data": {"title": "Polite Particles", "text": "Men say Baat. Women say Jaa."}},
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
            {"type": "theory", "data": {"title": "Negation Sandwich", "text": "Format: Mɨn + Verb + Te."}},
            {"type": "vocab_card",
             "data": {"front": "Yes (M)", "back": "បាទ", "pronunciation": "Baat", "context": "Male."}},
            {"type": "vocab_card",
             "data": {"front": "No", "back": "ទេ", "pronunciation": "Te", "context": "Particle."}},
            {"type": "quiz", "data": {"question": "Male Yes?", "options": ["Baat", "Jaa"], "correct_answer": "Baat"}}
        ]
    }
}


# ==========================================
# 2. СБОРЩИК "УМНОГО ПОВТОРЕНИЯ" (Карточки)
# ==========================================

def generate_review_mode(all_lessons):
    """
    Собирает все карточки в один большой 'Альбом' для повторения.
    Без квизов, только польза.
    """
    print("🔄 Generating Swipeable Review Mode...")

    review_cards = []

    # Карточка-обложка
    review_cards.append({
        "type": "theory",
        "data": {
            "title": "📖 Chapter 1 Review",
            "text": "Swipe to review all grammar rules and vocabulary from this chapter."
        }
    })

    # 1. Сначала собираем Грамматику (Rules)
    review_cards.append(
        {"type": "theory", "data": {"title": "🧠 Grammar Section", "text": "Let's refresh the rules first."}})

    for lid, lesson in all_lessons.items():
        for item in lesson['content']:
            # Берем теорию, но без финальных поздравлений
            if item['type'] == 'theory' and '🎉' not in item['data']['title']:
                # Добавляем пометку "Из урока такого-то"
                item_copy = item.copy()
                item_copy['data']['title'] = f"Rule: {item['data']['title']}"
                review_cards.append(item_copy)

    # 2. Потом собираем Словарь (Vocabulary)
    review_cards.append(
        {"type": "theory", "data": {"title": "🔊 Vocabulary Section", "text": "Tap to listen and repeat."}})

    for lid, lesson in all_lessons.items():
        for item in lesson['content']:
            if item['type'] == 'vocab_card':
                # Это полноценные карточки! Они будут играть звук!
                review_cards.append(item)

    # Финиш
    review_cards.append({
        "type": "theory",
        "data": {
            "title": "✅ Review Complete",
            "text": "You are ready to move to the next chapter!"
        }
    })

    return review_cards


# ==========================================
# 3. ЗАПУСК
# ==========================================

async def main():
    # 1. Заливаем обычные уроки
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])

    # 2. Заливаем "Урок-Повторение" (ID 100)
    # Теперь это набор карточек, а не текст.
    review_content = generate_review_mode(CHAPTER_1_DATA)

    await seed_lesson(
        100,
        "Chapter 1 Review",  # Нормальное название
        "Swipe to review all words and rules.",
        review_content
    )

    print("🚀 All lessons and Interactive Review (100) are synced!")


if __name__ == "__main__":
    asyncio.run(main())