import asyncio
from database_engine import seed_lesson, supabase

# ==========================================
# 1. ДАННЫЕ УРОКОВ
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
# 2. ГЕНЕРАТОР СПИСКА ДЛЯ КАЖДОГО УРОКА
# ==========================================

def inject_guidebook_into_lesson(lesson_id, lesson_data):
    """
    Создает текстовый список (шпаргалку) и прячет его внутри урока
    под типом 'guidebook'.
    """
    print(f"   📝 Generating boring list for Lesson {lesson_id}...")

    # Формируем скучный список (Markdown style)
    list_text = f"## {lesson_data['title']}\n\n"

    # 1. Сначала Правила
    list_text += "### 🧠 Rules\n"
    has_theory = False
    for item in lesson_data['content']:
        if item['type'] == 'theory':
            list_text += f"* **{item['data']['title']}:** {item['data']['text']}\n"
            has_theory = True
    if not has_theory: list_text += "No grammar rules in this lesson.\n"

    # 2. Потом Слова
    list_text += "\n### 📚 Vocabulary\n"
    for item in lesson_data['content']:
        if item['type'] == 'vocab_card':
            khmer = item['data']['back']
            eng = item['data']['front']
            pron = item['data']['pronunciation']
            # Формат строки: Кхмерский (Произношение) - Перевод
            list_text += f"* **{khmer}** ({pron}) — {eng}\n"

    # Добавляем этот список как СКРЫТУЮ карточку в урок
    guidebook_item = {
        "type": "guidebook",  # <-- Фронтенд должен искать этот тип для модалки
        "data": {
            "title": "Cheat Sheet",
            "markdown": list_text
        }
    }

    # Добавляем в конец списка контента (но фронтенд не должен показывать её в слайдере)
    lesson_data['content'].append(guidebook_item)
    return lesson_data


# ==========================================
# 3. ЗАПУСК
# ==========================================

async def main():
    print("🗑️ Deleting old Reference Lesson (100)...")
    try:
        supabase.table("lesson_items").delete().eq("lesson_id", 100).execute()
        supabase.table("lessons").delete().eq("id", 100).execute()
        print("   ✅ Old Lesson 100 deleted.")
    except Exception as e:
        print(f"   ⚠️ Could not delete lesson 100 (maybe already gone): {e}")

    print("\n🌟 Updating Lessons with embedded Guidebooks...")

    for lesson_id, info in CHAPTER_1_DATA.items():
        # Внедряем шпаргалку внутрь данных
        updated_info = inject_guidebook_into_lesson(lesson_id, info)

        # Заливаем в базу
        await seed_lesson(lesson_id, updated_info["title"], updated_info["desc"], updated_info["content"])

    print("🚀 Done! Use the 'guidebook' item inside each lesson for the book icon.")


if __name__ == "__main__":
    asyncio.run(main())