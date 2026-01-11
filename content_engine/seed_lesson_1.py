import asyncio
from database_engine import seed_lesson

# Полная Глава 1: Этикет, вежливость и приветствия
CHAPTER_1_DATA = {
    101: {
        "title": "Lesson 1.1: Greetings & Sampeah",
        "desc": "How to say Hello and show respect in Cambodia.",
        "content": [
            {"type": "theory", "data": {"title": "The Art of Sampeah",
             "text": "Khmer culture is hierarchical. Peers = Chest, Elders = Nose, Monks/King = Forehead."}},
            {"type": "vocab_card", "data": {"front": "Hello (General)", "back": "សួស្តី", "pronunciation": "Sues-dey"}},
            {"type": "vocab_card", "data": {"front": "Hello (Formal)", "back": "ជំរាបសួរ", "pronunciation": "Choum Reap Sour"}},
            {"type": "vocab_card", "data": {"front": "Good Morning", "back": "អរុណសួស្តី", "pronunciation": "Arun Sues-dey"}},
            {"type": "vocab_card", "data": {"front": "Good Night", "back": "រាត្រីសួស្តី", "pronunciation": "Reatrey Sues-dey"}},
            {"type": "vocab_card", "data": {"front": "How are you?", "back": "សុខសប្បាយទេ?", "pronunciation": "Sok sabay te?"}},
            {"type": "vocab_card", "data": {"front": "I am fine", "back": "សុខសប្បាយ", "pronunciation": "Sok sabay"}},
            {
                "type": "quiz",
                "data": {
                    "question": "Which greeting is used for elders and teachers?",
                    "options": ["ជំរាបសួរ (Choum Reap Sour)", "សួស្តី (Sues-dey)"],
                    "correct_answer": "ជំរាបសួរ (Choum Reap Sour)",
                    "explanation": "Always use formal greetings (Choum Reap Sour) for those higher in hierarchy."
                }
            }
        ]
    },
    102: {
        "title": "Lesson 1.2: Politeness & Etiquette",
        "desc": "Essential manners: Yes, No, Sorry and Thank you.",
        "content": [
            {"type": "theory", "data": {"title": "Polite Particles",
             "text": "Men end sentences with 'Baat', women with 'Jaa'. Using them shows you respect Khmer culture."}},
            {"type": "vocab_card", "data": {"front": "Yes (Male)", "back": "បាទ", "pronunciation": "Baat"}},
            {"type": "vocab_card", "data": {"front": "Yes (Female)", "back": "ចាស", "pronunciation": "Jaa"}},
            {"type": "vocab_card", "data": {"front": "No", "back": "ទេ", "pronunciation": "Ot-te"}},
            {"type": "vocab_card", "data": {"front": "Thank you", "back": "អរគុណ", "pronunciation": "Akun"}},
            {"type": "vocab_card", "data": {"front": "Thank you very much", "back": "អរគុណច្រើន", "pronunciation": "Akun jran"}},
            {"type": "vocab_card", "data": {"front": "Sorry / Excuse me", "back": "សុំទោស", "pronunciation": "Som-doh"}},
            {"type": "vocab_card", "data": {"front": "No problem / It's okay", "back": "អត់អីទេ", "pronunciation": "Ot-ey-te"}},
            {"type": "vocab_card", "data": {"front": "Goodbye (Formal)", "back": "ជំរាបលា", "pronunciation": "Choum Reap Lea"}},
            {"type": "vocab_card", "data": {"front": "Goodbye (Informal)", "back": "លាហើយ", "pronunciation": "Lea-hey"}},
            {
                "type": "quiz",
                "data": {
                    "question": "You accidentally bumped into someone. What do you say?",
                    "options": ["សុំទោស (Som-doh)", "អរគុណ (Akun)", "បាទ (Baat)"],
                    "correct_answer": "សុំទោស (Som-doh)",
                    "explanation": "Som-doh is used for both 'Sorry' and 'Excuse me'."
                }
            }
        ]
    }
}

async def main():
    print("🌟 Starting Comprehensive Chapter 1 Import...")
    for lesson_id, info in CHAPTER_1_DATA.items():
        # Используем твой движок database_engine для загрузки
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])
    print("🚀 All sub-lessons for Chapter 1 are synced and vocabulary is updated!")

if __name__ == "__main__":
    asyncio.run(main())