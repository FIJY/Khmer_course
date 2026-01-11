import asyncio
from database_engine import seed_lesson

# Глобальный конфиг главы: Собираем 1.1 и 1.2 в один запуск
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
            {
                "type": "quiz",
                "data": {
                    "question": "Which greeting is used for elders and teachers?",
                    "options": ["ជំរាបសួរ (Choum Reap Sour)", "សួស្តី (Sues-dey)"],
                    "correct_answer": "ជំរាបសួរ (Choum Reap Sour)",
                    "explanation": "Formal greeting (Choum Reap Sour) is a sign of deep respect."
                }
            }
        ]
    },
    102: {
        "title": "Lesson 1.2: Politeness & Gender",
        "desc": "Essential manners: Yes, No, and Thank you.",
        "content": [
            {"type": "theory", "data": {"title": "Baat & Jaa",
             "text": "Men end sentences with 'Baat', women with 'Jaa'. These are vital for being polite."}},
            {"type": "vocab_card", "data": {"front": "Yes (Male)", "back": "បាទ", "pronunciation": "Baat"}},
            {"type": "vocab_card", "data": {"front": "Yes (Female)", "back": "ចាស", "pronunciation": "Jaa"}},
            {"type": "vocab_card", "data": {"front": "No", "back": "ទេ", "pronunciation": "Ot-te"}},
            {"type": "vocab_card", "data": {"front": "Thank you", "back": "អរគុណ", "pronunciation": "Akun"}},
            {"type": "vocab_card", "data": {"front": "Sorry / Excuse me", "back": "សុំទោស", "pronunciation": "Som-doh"}},
            {"type": "vocab_card", "data": {"front": "Goodbye", "back": "ជំរាបលា", "pronunciation": "Choum Reap Lea"}},
            {
                "type": "quiz",
                "data": {
                    "question": "How does a woman say 'Yes' politely?",
                    "options": ["ចាស (Jaa)", "បាទ (Baat)"],
                    "correct_answer": "ចាស (Jaa)",
                    "explanation": "Women use 'Jaa', men use 'Baat'."
                }
            }
        ]
    }
}

async def main():
    print("🌟 Starting Comprehensive Chapter 1 Import...")
    for lesson_id, info in CHAPTER_1_DATA.items():
        # Используем твой движок database_engine
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])
    print("🚀 All sub-lessons for Chapter 1 are synced!")

if __name__ == "__main__":
    asyncio.run(main())