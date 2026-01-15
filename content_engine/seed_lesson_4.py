import asyncio

CHAPTER_4_DATA = {
    401: {
        "title": "Lesson 4.1: Polite Transport",
        "desc": "How to use 'Soum' and direct Tuk-tuk drivers with precision.",
        "content": [
            # STEP 1: POLITE REQUESTS (SOUM)
            {"type": "theory", "data": {"title": "The Power of 'Soum'",
                                        "text": "In Khmer, 'Soum' (សូម) means 'Please'. Starting requests with it shows high respect."}},
            {"type": "vocab_card",
             "data": {"front": "Please", "back": "សូម", "pronunciation": "Soum", "dictionary_id": "REQ_001"}},
            {"type": "vocab_card",
             "data": {"front": "Help", "back": "ជួយ", "pronunciation": "Chuoy", "dictionary_id": "REQ_002"}},
            {"type": "vocab_card",
             "data": {"front": "Please help me", "back": "សូមជួយខ្ញុំ", "pronunciation": "Soum chuoy knyom",
                      "dictionary_id": "PHR_004"}},
            {"type": "quiz", "data": {
                "question": "How do you say 'Please' to start a polite request?",
                "options": ["សូម (Soum)", "ជួយ (Chuoy)", "បាទ (Baat)"],
                "correct_answer": "សូម (Soum)",
                "explanation": "Soum is essential for any polite interaction in Cambodia."
            }},
            # STEP 2: TUK-TUK NAVIGATION
            {"type": "theory", "data": {"title": "Directing Your Driver",
                                        "text": "Precision is key. Use these core commands to reach your destination."}},
            {"type": "vocab_card",
             "data": {"front": "Stop", "back": "ឈប់", "pronunciation": "Chhoup", "dictionary_id": "TRN_001"}},
            {"type": "vocab_card", "data": {"front": "Turn left", "back": "បត់ឆ្វេង", "pronunciation": "Bot chveng",
                                            "dictionary_id": "TRN_002"}},
            {"type": "vocab_card", "data": {"front": "Turn right", "back": "បត់ស្តាំ", "pronunciation": "Bot sdam",
                                            "dictionary_id": "TRN_003"}},
            {"type": "vocab_card",
             "data": {"front": "Please stop here", "back": "សូមឈប់ទីនេះ", "pronunciation": "Soum chhoup ti-nih",
                      "dictionary_id": "PHR_005"}},
            {"type": "quiz", "data": {
                "question": "The driver is going the wrong way! How do you say 'Turn Left'?",
                "options": ["បត់ឆ្វេង (Bot chveng)", "បត់ស្តាំ (Bot sdam)", "ទៅត្រង់ (Tov trang)"],
                "correct_answer": "បត់ឆ្វេង (Bot chveng)",
                "explanation": "Bot chveng means 'Turn Left'."
            }}
        ]
    },
    402: {
        "title": "Lesson 4.2: Finding Places & Safety",
        "desc": "Learn to ask for locations and handle unexpected situations.",
        "content": [
            # STEP 3: ASKING "WHERE IS...?"
            {"type": "theory", "data": {"title": "Finding Your Way",
                                        "text": "Formula: [Noun] + 'Nov ae-na?' (នៅឯណា?) = Where is [Noun]?"}},
            {"type": "vocab_card",
             "data": {"front": "Where is...?", "back": "នៅឯណា?", "pronunciation": "... nov ae-na?",
                      "dictionary_id": "NAV_006"}},
            {"type": "vocab_card", "data": {"front": "Hotel", "back": "សណ្ឋាគារ", "pronunciation": "Sonn-tha-kea",
                                            "dictionary_id": "NAV_007"}},
            {"type": "vocab_card",
             "data": {"front": "Toilet", "back": "បង្គន់", "pronunciation": "Bong-kun", "dictionary_id": "NAV_008"}},
            {"type": "quiz", "data": {
                "question": "How do you ask 'Where is the hotel?'",
                "options": ["សណ្ឋាគារនៅឯណា? (Sonn-tha-kea nov ae-na?)", "សូមជួយខ្ញុំ (Soum chuoy knyom)"],
                "correct_answer": "សណ្ឋាគារនៅឯណា? (Sonn-tha-kea nov ae-na?)",
                "explanation": "Place the location (Hotel) before 'Nov ae-na?'."
            }},
            # STEP 4: EMERGENCY & WAITING
            {"type": "vocab_card",
             "data": {"front": "Wait a minute", "back": "ចាំមួយភ្លែត", "pronunciation": "Cham mouy phlet",
                      "dictionary_id": "PHR_007"}},
            {"type": "vocab_card",
             "data": {"front": "I'm lost", "back": "ខ្ញុំវង្វេងផ្លូវ", "pronunciation": "Knyom vong-veng plov",
                      "dictionary_id": "PHR_008"}},
            {"type": "quiz", "data": {
                "question": "You don't know where you are. What do you say?",
                "options": ["ខ្ញុំវង្វេងផ្លូវ (Knyom vong-veng plov)", "ចាំមួយភ្លែត (Cham mouy phlet)"],
                "correct_answer": "ខ្ញុំវង្វេងផ្លូវ (Knyom vong-veng plov)",
                "explanation": "Knyom vong-veng plov means 'I am lost'."
            }}
        ]
    }
}


async def main():
    from database_engine import seed_lesson

    print("🌟 Starting Final Survival Import (Chapter 4)...")
    for lesson_id, info in CHAPTER_4_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])
    print("🚀 All Chapter 4 items are synced! Check your profile for updated word counts.")


def get_lessons():
    return CHAPTER_4_DATA


if __name__ == "__main__":
    asyncio.run(main())
