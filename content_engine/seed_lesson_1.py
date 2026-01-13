import asyncio
from database_engine import seed_lesson, supabase

# --- КОНТЕНТ УРОКОВ (Без лишнего) ---
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
             "data": {"front": "No", "back": "ទេ", "pronunciation": "Te", "context": "Particle."}},
            {"type": "quiz", "data": {"question": "Male Yes?", "options": ["Baat", "Jaa"], "correct_answer": "Baat"}}
        ]
    }
}


# --- ГЕНЕРАТОР ТЕКСТА ДЛЯ КНИЖЕЧКИ ---
def generate_summary_text(all_lessons):
    text = "# Chapter 1 Vocabulary & Rules\n\n"
    for lid, lesson in all_lessons.items():
        text += f"## {lesson['title']}\n"
        # Правила
        for item in lesson['content']:
            if item['type'] == 'theory':
                text += f"* 💡 {item['data']['title']}: {item['data']['text']}\n"
        # Слова
        for item in lesson['content']:
            if item['type'] == 'vocab_card':
                text += f"* **{item['data']['back']}** - {item['data']['front']}\n"
        text += "\n"
    return text


async def main():
    print("🧹 Cleaning up old Lesson 100 (Removing the extra bubble)...")
    try:
        supabase.table("lessons").delete().eq("id", 100).execute()
        print("   ✅ Lesson 100 deleted.")
    except Exception as e:
        print(f"   ⚠️ Lesson 100 cleanup: {e}")

    print("\n🌟 Syncing Lessons 101-103...")
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])

    print("\n📘 Populating 'Book Icon' (Study Materials)...")
    summary_text = generate_summary_text(CHAPTER_1_DATA)

    # Пытаемся записать в таблицу study_materials (на которую ругался интерфейс)
    try:
        # Предполагаем, что Chapter 1 имеет ID = 1
        supabase.table("study_materials").upsert({
            "chapter_id": 1,
            "content": summary_text,
            "type": "summary"
        }, on_conflict="chapter_id").execute()
        print("   ✅ Success! Inserted into 'study_materials'.")
    except Exception as e:
        print(f"   ❌ Failed to insert into 'study_materials'. Error: {e}")
        print("   🔍 Если вы видите эту ошибку, проверьте точное название таблицы в базе.")

    print("🚀 Done! Map should be clean. Book should have text.")


if __name__ == "__main__":
    asyncio.run(main())