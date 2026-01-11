import asyncio
from database_engine import seed_lesson

# Глобальный конфиг главы
CHAPTER_1_DATA = {
    101: {
        "title": "Lesson 1.1: Greetings & Sampeah",
        "desc": "How to say Hello and show respect in Cambodia.",
        "content": [
            {"type": "theory", "data": {"title": "The Art of Sampeah",
             "text": "Khmer culture is hierarchical. Peers = Chest, Elders = Nose."}},
            {"type": "vocab_card", "data": {"front": "Hello (General)", "back": "សួស្តី", "pronunciation": "Sues-dey"}},
            {"type": "vocab_card", "data": {"front": "Hello (Formal)", "back": "ជំរាបសួរ", "pronunciation": "Choum Reap Sour"}},
            {
                "type": "quiz",
                "data": {
                    "question": "You meet a monk. Which greeting is correct?",
                    "options": ["ជំរាបសួរ", "សួស្តី", "បាទ"],
                    "correct_answer": "ជំរាបសួរ",
                    "explanation": "Formal greeting is required for monks."
                }
            }
        ]
    },
    102: {
        "title": "Lesson 1.2: Politeness & Gender",
        "desc": "Mastering 'Baat', 'Jaa' and essential manners.",
        "content": [
            {"type": "theory", "data": {"title": "Gendered Particles",
             "text": "Men end sentences with 'Baat', women with 'Jaa'. These also mean 'Yes'."}},
            {"type": "vocab_card", "data": {"front": "Yes (Male)", "back": "បាទ", "pronunciation": "Baat"}},
            {"type": "vocab_card", "data": {"front": "Yes (Female)", "back": "ចាស", "pronunciation": "Jaa"}},
            {"type": "vocab_card", "data": {"front": "Thank you", "back": "អរគុណ", "pronunciation": "Akun"}},
            {
                "type": "quiz",
                "data": {
                    "question": "If you are a woman, how do you say 'Yes'?",
                    "options": ["ចាស", "បាទ", "ទេ"],
                    "correct_answer": "ចាស",
                    "explanation": "Women use 'Jaa' for politeness and 'Yes'."
                }
            }
        ]
    }
}

async def main():
    print("🌟 Starting Chapter 1 Import...")
    for lesson_id, info in CHAPTER_1_DATA.items():
        # Вызываем наш универсальный движок для каждого подурока
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])
    print("🚀 All sub-lessons for Chapter 1 are synced!")

if __name__ == "__main__":
    asyncio.run(main())