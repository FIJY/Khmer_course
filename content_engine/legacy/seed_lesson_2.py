import asyncio

CHAPTER_2_DATA = {
    201: {
        "title": "Lesson 2.1: Navigation & Emergencies",
        "desc": "How to find essential services: Toilets, Pharmacies, and Hospitals.",
        "content": [
            # БЛОК 1: ТУАЛЕТ И АПТЕКА
            {"type": "vocab_card", "data": {"front": "Toilet", "back": "បន្ទប់ទឹក", "pronunciation": "Bantub teuk",
                                            "dictionary_id": "NAV_001"}},
            {"type": "vocab_card", "data": {"front": "Pharmacy", "back": "ឱសថស្ថាន", "pronunciation": "O-soth sala",
                                            "dictionary_id": "NAV_002"}},
            {"type": "quiz", "data": {
                "question": "Where do you go to buy medicine?",
                "options": ["ឱសថស្ថាន (O-soth sala)", "បន្ទប់ទឹក (Bantub teuk)"],
                "correct_answer": "ឱសថស្ថាន (O-soth sala)",
                "explanation": "O-soth sala is your go-to for medical supplies."
            }},
            # БЛОК 2: БАНК И БОЛЬНИЦА
            {"type": "vocab_card", "data": {"front": "ATM / Bank", "back": "ធនាគារ", "pronunciation": "Thaneakea",
                                            "dictionary_id": "NAV_003"}},
            {"type": "vocab_card", "data": {"front": "Hospital", "back": "មន្ទីរពេទ្យ", "pronunciation": "Monti phet",
                                            "dictionary_id": "NAV_004"}},
            {"type": "quiz", "data": {
                "question": "How do you say 'Hospital'?",
                "options": ["មន្ទីរពេទ្យ (Monti phet)", "ធនាគារ (Thaneakea)", "បន្ទប់ទឹក (Bantub teuk)"],
                "correct_answer": "មន្ទីរពេទ្យ (Monti phet)",
                "explanation": "Monti phet is used for hospitals and medical clinics."
            }},
            # БЛОК 3: ГРАММАТИКА ПОИСКА
            {"type": "theory", "data": {"title": "Asking 'Where is...?'",
                                        "text": "Place + Snaov ena? (ស្នាក់នៅឯណា?) = Where is [Place]?"}},
            {"type": "quiz", "data": {
                "question": "Translate: 'Where is the ATM?'",
                "options": ["Thaneakea snaov ena?", "O-soth sala snaov ena?", "Arun Sues-dey"],
                "correct_answer": "Thaneakea snaov ena?",
                "explanation": "Thaneakea (Bank/ATM) + Snaov ena (Where is) is the standard formula."
            }}
        ]
    },
    202: {
        "title": "Lesson 2.2: Basic Needs & Wants",
        "desc": "Expressing desires for food, water, and ice.",
        "content": [
            # БЛОК 4: ВОДА И ЕДА
            {"type": "vocab_card",
             "data": {"front": "Water", "back": "ទឹក", "pronunciation": "Tuk", "dictionary_id": "FOOD_002"}},
            {"type": "vocab_card",
             "data": {"front": "Ice", "back": "ទឹកកក", "pronunciation": "Tuk kok", "dictionary_id": "FOOD_005"}},
            {"type": "quiz", "data": {
                "question": "What is the literal translation of 'Ice'?",
                "options": ["Hard water (Tuk kok)", "Cold water (Tuk trachoak)"],
                "correct_answer": "Hard water (Tuk kok)",
                "explanation": "In Khmer, Ice (Tuk kok) literally means 'Frozen/Hard Water'."
            }},
            # БЛОК 5: JONG VS JONG BAN
            {"type": "theory", "data": {"title": "Jong vs Jong Ban",
                                        "text": "Jong = Want to do (verb). Jong Ban = Want to have (noun)."}},
            {"type": "vocab_card",
             "data": {"front": "I want water", "back": "ខ្ញុំចង់បានទឹក", "pronunciation": "Knyom jong ban tuk",
                      "dictionary_id": "PHR_001"}},
            {"type": "quiz", "data": {
                "question": "Which is correct for 'I want water'?",
                "options": ["Knyom jong ban tuk", "Knyom jong tuk"],
                "correct_answer": "Knyom jong ban tuk",
                "explanation": "Since water is a noun, you must use 'Jong Ban'."
            }},
            # ФИНАЛЬНЫЙ ЭКЗАМЕН УРОКА
            {"type": "quiz", "data": {
                "question": "You need money. What do you look for?",
                "options": ["Thaneakea", "Bantub teuk", "O-soth sala"],
                "correct_answer": "Thaneakea",
                "explanation": "Thaneakea is where the ATMs are located."
            }}
        ]
    }
}


async def main():
    from database_engine import seed_lesson

    print("🌟 Starting Commercial Chapter 2 Import...")
    for lesson_id, info in CHAPTER_2_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])
    print("🚀 Content sync complete! 14 items added to the database.")


def get_lessons():
    return CHAPTER_2_DATA


if __name__ == "__main__":
    asyncio.run(main())
