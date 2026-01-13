import asyncio
from database_engine import seed_lesson, supabase

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


def inject_guidebook_into_lesson(lesson_id, lesson_data):
    """
    Создает шпаргалку, маскируя её под 'theory',
    но с флагом 'is_guidebook', чтобы база не ругалась.
    """
    print(f"   📝 Generating hidden cheat-sheet for Lesson {lesson_id}...")

    list_text = f"## {lesson_data['title']}\n\n"
    list_text += "### 🧠 Rules\n"
    has_theory = False
    for item in lesson_data['content']:
        if item['type'] == 'theory':
            list_text += f"* **{item['data']['title']}:** {item['data']['text']}\n"
            has_theory = True
    if not has_theory: list_text += "No grammar rules in this lesson.\n"

    list_text += "\n### 📚 Vocabulary\n"
    for item in lesson_data['content']:
        if item['type'] == 'vocab_card':
            khmer = item['data']['back']
            eng = item['data']['front']
            pron = item['data']['pronunciation']
            list_text += f"* **{khmer}** ({pron}) — {eng}\n"

    # ХИТРОСТЬ: Используем тип 'theory' (он разрешен), но добавляем флаг
    guidebook_item = {
        "type": "theory",
        "data": {
            "title": "Cheat Sheet",
            "text": "Hidden content",  # Заглушка
            "markdown": list_text,
            "is_guidebook": True  # <--- ФРОНТЕНД БУДЕТ ИСКАТЬ ЭТОТ ФЛАГ
        }
    }

    lesson_data['content'].append(guidebook_item)
    return lesson_data


async def main():
    print("🗑️ Cleaning up...")
    try:
        supabase.table("lessons").delete().eq("id", 100).execute()
    except:
        pass

    print("\n🌟 Updating Lessons...")
    for lesson_id, info in CHAPTER_1_DATA.items():
        updated_info = inject_guidebook_into_lesson(lesson_id, info)
        await seed_lesson(lesson_id, updated_info["title"], updated_info["desc"], updated_info["content"])

    print("🚀 Success! Frontend instruction: Find item where data.is_guidebook == True")


if __name__ == "__main__":
    asyncio.run(main())