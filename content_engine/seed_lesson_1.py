import asyncio
from database_engine import seed_lesson

# ==========================================
# 1. ИСХОДНЫЕ ДАННЫЕ (Source of Truth)
# ==========================================

CHAPTER_1_DATA = {
    101: {
        "title": "Lesson 1.1: The Anatomy of Hello",
        "desc": "Deep dive into greetings and self-reference.",
        "content": [
            {"type": "theory", "data": {"title": "Components",
                                        "text": "Khmer words are often built from smaller meanings. Let's break them down."}},
            {"type": "vocab_card", "data": {"front": "Hello (Friends)", "back": "សួស្តី", "pronunciation": "Suəs-dey",
                                            "context": "Informal."}},
            {"type": "vocab_card",
             "data": {"front": "Hello (Formal)", "back": "ជំរាបសួរ", "pronunciation": "Cum-riəp Suə",
                      "context": "Lit: 'I inform and ask'."}},
            {"type": "vocab_card",
             "data": {"front": "I / Me", "back": "ខ្ញុំ", "pronunciation": "Kɲom", "context": "Universal 'I'."}},
            {"type": "vocab_card",
             "data": {"front": "You", "back": "អ្នក", "pronunciation": "Neak", "context": "Polite 'You'."}},
            {"type": "vocab_card",
             "data": {"front": "Health", "back": "សុខ", "pronunciation": "Sok", "context": "Component of 'Fine'."}},
            {"type": "vocab_card", "data": {"front": "Happiness", "back": "សប្បាយ", "pronunciation": "Sap-baay",
                                            "context": "Component of 'Fine'."}},
            {"type": "vocab_card", "data": {"front": "I am fine", "back": "សុខសប្បាយ", "pronunciation": "Sok Sap-baay",
                                            "context": "Lit: Healthy and Happy."}},
            {"type": "vocab_card", "data": {"front": "Question Particle", "back": "តើ", "pronunciation": "Tae",
                                            "context": "Starts a formal question."}},
            {"type": "quiz",
             "data": {"question": "Informal Hello?", "options": ["សួស្តី", "ជំរាបសួរ"], "correct_answer": "សួស្តី"}},
            {"type": "theory",
             "data": {"title": "🎉 Lesson 1.1 Summary", "text": "Sok + Sabay = Healthy + Happy. That's the Khmer way!"}}
        ]
    },
    102: {
        "title": "Lesson 1.2: Manners & Goodbyes",
        "desc": "Essential particles for polite conversation.",
        "content": [
            {"type": "theory",
             "data": {"title": "Polite Particles", "text": "Men say Baat. Women say Jaa. Don't mix them up!"}},
            {"type": "vocab_card", "data": {"front": "Bye (Informal)", "back": "លាហើយ", "pronunciation": "Liə-haəj",
                                            "context": "Leaving already."}},
            {"type": "vocab_card",
             "data": {"front": "Goodbye (Formal)", "back": "ជំរាបលា", "pronunciation": "Cum-riəp Liə",
                      "context": "Inform I am leaving."}},
            {"type": "vocab_card", "data": {"front": "Thank you", "back": "អរគុណ", "pronunciation": "Arkun",
                                            "context": "Glad for goodness."}},
            {"type": "vocab_card", "data": {"front": "Sorry", "back": "សូមទោស", "pronunciation": "Soum Toh",
                                            "context": "Ask for forgiveness."}},
            {"type": "quiz",
             "data": {"question": "Thank you?", "options": ["Arkun", "Soum Toh"], "correct_answer": "Arkun"}},
            {"type": "theory", "data": {"title": "🎉 Lesson 1.2 Summary", "text": "Remember: 'Liə' implies leaving."}}
        ]
    },
    103: {
        "title": "Lesson 1.3: Yes, No & Negation",
        "desc": "Agreements and the Negation Sandwich.",
        "content": [
            {"type": "vocab_card",
             "data": {"front": "Yes (Male)", "back": "បាទ", "pronunciation": "Baat", "context": "Polite particle."}},
            {"type": "vocab_card",
             "data": {"front": "Yes (Female)", "back": "ចាស", "pronunciation": "Jaa", "context": "Polite particle."}},
            {"type": "vocab_card",
             "data": {"front": "No", "back": "ទេ", "pronunciation": "Te", "context": "Particle."}},
            {"type": "vocab_card",
             "data": {"front": "No (Emphatic)", "back": "អត់ទេ", "pronunciation": "Ot-Te", "context": "Common No."}},
            {"type": "vocab_card",
             "data": {"front": "Not (Start)", "back": "មិន", "pronunciation": "Mɨn", "context": "Before verb."}},
            {"type": "vocab_card",
             "data": {"front": "I am NOT fine", "back": "ខ្ញុំមិនសុខសប្បាយទេ", "pronunciation": "Kɲom mɨn sok-sabay te",
                      "context": "Mɨn ... Te sandwich."}},
            {"type": "quiz", "data": {"question": "Male Yes?", "options": ["Baat", "Jaa"], "correct_answer": "Baat"}},
            {"type": "theory", "data": {"title": "🎉 Lesson 1.3 Summary", "text": "The Sandwich: Mɨn [Verb] Te."}}
        ]
    }
}


# ==========================================
# 2. ГЕНЕРАТОР СПРАВОЧНИКА (Автоматика)
# ==========================================

def generate_guidebook(all_lessons_data):
    """
    Пробегает по всем урокам, собирает слова и правила,
    и создает контент для Справочника (ID 100).
    """
    print("🤖 Auto-generating Guidebook content...")

    collected_vocab = []
    collected_theory = []

    # 1. Пылесосим данные из уроков
    for lesson_id, lesson in all_lessons_data.items():
        for item in lesson['content']:
            # Собираем слова
            if item['type'] == 'vocab_card':
                # Добавляем пометку, из какого это урока (для красоты)
                item['data']['source_lesson'] = lesson['title']
                collected_vocab.append(item)

            # Собираем теорию (исключая финальные саммари с '🎉')
            if item['type'] == 'theory' and '🎉' not in item['data']['title']:
                collected_theory.append(item)

    # 2. Формируем контент Справочника
    guidebook_content = []

    # Блок А: Вступление
    guidebook_content.append({
        "type": "theory",
        "data": {
            "title": "📖 Chapter 1 Guidebook",
            "text": f"Here is everything you learned in Chapter 1.\nTotal words: {len(collected_vocab)}\nGrammar notes: {len(collected_theory)}"
        }
    })

    # Блок Б: Грамматика (сначала повторяем правила)
    # Добавляем разделитель
    guidebook_content.append({
        "type": "theory",
        "data": {"title": "🧠 Grammar Recap", "text": "Let's review the rules first."}
    })
    guidebook_content.extend(collected_theory)

    # Блок В: Все слова (списком карточек)
    guidebook_content.append({
        "type": "theory",
        "data": {"title": "📚 Vocabulary List", "text": "Swipe to review all words from this chapter."}
    })
    guidebook_content.extend(collected_vocab)

    return guidebook_content


# ==========================================
# 3. ОСНОВНОЙ СКРИПТ ЗАГРУЗКИ
# ==========================================

async def main():
    print("🌟 Starting SMART Chapter 1 Import...")

    # Шаг 1: Заливаем обычные уроки (101, 102, 103)
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])

    # Шаг 2: Генерируем и заливаем Справочник (100)
    guidebook_items = generate_guidebook(CHAPTER_1_DATA)

    await seed_lesson(
        100,
        "Chapter 1: Full Guidebook",
        "Auto-generated summary of all Chapter 1 content.",
        guidebook_items
    )

    print("🚀 All lessons AND Guidebook (100) are synced!")


if __name__ == "__main__":
    asyncio.run(main())