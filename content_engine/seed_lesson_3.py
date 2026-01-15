import asyncio

CHAPTER_3_DATA = {
    301: {
        "title": "Lesson 3.1: Numbers 1-19",
        "desc": "Master the foundation: 1-5, the 5+X pattern, and the Teens.",
        "content": [
            # БЛОК 1: 1-5 (Foundations)
            {"type": "theory", "data": {"title": "The Base: 1-5",
                                        "text": "Khmer numbers are the building blocks. Master these five first."}},
            {"type": "vocab_card",
             "data": {"front": "1 — One", "back": "មួយ", "pronunciation": "Mouy", "dictionary_id": "NUM_001"}},
            {"type": "vocab_card",
             "data": {"front": "2 — Two", "back": "ពីរ", "pronunciation": "Pii", "dictionary_id": "NUM_002"}},
            {"type": "vocab_card",
             "data": {"front": "5 — Five", "back": "ប្រាំ", "pronunciation": "Pram", "dictionary_id": "NUM_005"}},
            {"type": "quiz", "data": {
                "question": "What is 'Two' in Khmer?",
                "options": ["ពីរ (Pii)", "មួយ (Mouy)", "បី (Bei)"],
                "correct_answer": "ពីរ (Pii)",
                "explanation": "2 is Pii. Remember it to build number 7 later!"
            }},
            # БЛОК 2: 6-9 (Pattern 5+X) [cite: 11, 2026-01-12]
            {"type": "theory", "data": {"title": "Pattern: 5 + X",
                                        "text": "Numbers 6-9 use a '5 + unit' logic. Example: 6 = 5 (Pram) + 1 (Mouy)."}},
            {"type": "vocab_card", "data": {"front": "6 (5+1)", "back": "ប្រាំមួយ", "pronunciation": "Pram-Mouy",
                                            "dictionary_id": "NUM_006"}},
            {"type": "vocab_card",
             "data": {"front": "7 (5+2)", "back": "ប្រាំពីរ", "pronunciation": "Pram-Pii", "dictionary_id": "NUM_007"}},
            {"type": "quiz", "data": {
                "question": "Using the 5+X logic, what is 7?",
                "options": ["ប្រាំពីរ (Pram-Pii)", "ប្រាំមួយ (Pram-Mouy)", "ពីរប្រាំ (Pii-Pram)"],
                "correct_answer": "ប្រាំពីរ (Pram-Pii)",
                "explanation": "7 is 5 (Pram) + 2 (Pii) = Pram-Pii."
            }},
            # БЛОК 3: 10-19 (Pattern 10+X)
            {"type": "theory", "data": {"title": "The Teens: 10 + X",
                                        "text": "10 is 'Dop'. Numbers 11-19 simply add the unit after it."}},
            {"type": "vocab_card",
             "data": {"front": "10", "back": "ដប់", "pronunciation": "Dop", "dictionary_id": "NUM_010"}},
            {"type": "vocab_card", "data": {"front": "15 (10+5)", "back": "ដប់ប្រាំ", "pronunciation": "Dop-Pram",
                                            "dictionary_id": "NUM_015"}},
            {"type": "quiz", "data": {
                "question": "How do you say 15?",
                "options": ["ដប់ប្រាំ (Dop-Pram)", "ដប់មួយ (Dop-Mouy)", "ប្រាំដប់ (Pram-Dop)"],
                "correct_answer": "ដប់ប្រាំ (Dop-Pram)",
                "explanation": "15 is 10 (Dop) + 5 (Pram)."
            }}
        ]
    },
    302: {
        "title": "Lesson 3.2: Markets & Big Numbers",
        "desc": "Tens, Hundreds, Thousands and how to handle Money.",
        "content": [
            # БЛОК 4: ДЕСЯТКИ 20-90
            {"type": "theory",
             "data": {"title": "The Tens (20-90)", "text": "20 is unique (Ma-Phei). 30-90 mostly end with 'Sep'."}},
            {"type": "vocab_card",
             "data": {"front": "20", "back": "ម្ភៃ", "pronunciation": "Ma-Phei", "dictionary_id": "NUM_020"}},
            {"type": "vocab_card",
             "data": {"front": "50", "back": "ហាសិប", "pronunciation": "Ha-Sep", "dictionary_id": "NUM_050"}},
            {"type": "quiz", "data": {
                "question": "Translate: Fifty (50)",
                "options": ["ហាសិប (Ha-Sep)", "ហុកសិប (Hok-Sep)", "ម្ភៃ (Ma-Phei)"],
                "correct_answer": "ហាសិប (Ha-Sep)",
                "explanation": "50 is Ha-Sep. 20 is Ma-Phei."
            }},
            # БЛОК 5: СОТНИ И ТЫСЯЧИ (Market Scales)
            {"type": "theory",
             "data": {"title": "Big Numbers", "text": "100 = Roy. 1,000 = Poan. 10,000 = Meun (essential for Riel!)."}},
            {"type": "vocab_card",
             "data": {"front": "100", "back": "មួយរយ", "pronunciation": "Mouy Roy", "dictionary_id": "NUM_100"}},
            {"type": "vocab_card",
             "data": {"front": "10,000", "back": "មួយម៉ឺន", "pronunciation": "Mouy Meun", "dictionary_id": "NUM_10K"}},
            # БЛОК 6: ДЕНЬГИ (Market Survival)
            {"type": "theory", "data": {"title": "Money & Half",
                                        "text": "Dollar = Dol-la. Half (0.5) = Kanh-lah. $1.50 = Mouy Dol-la Kanh-lah."}},
            {"type": "vocab_card",
             "data": {"front": "$1.50", "back": "មួយដុល្លារកន្លះ", "pronunciation": "Mouy Dol-la Kanh-lah",
                      "dictionary_id": "MON_001"}},
            {"type": "quiz", "data": {
                "question": "A coffee is $2.50. What do you say?",
                "options": ["ពីរដុល្លារកន្លះ (Pii Dol-la Kanh-lah)", "ពីរកន្លះដុល្លារ (Pii Kanh-lah Dol-la)"],
                "correct_answer": "ពីរដុល្លារកន្លះ (Pii Dol-la Kanh-lah)",
                "explanation": "Pattern: Number + Currency + Half."
            }}
        ]
    }
}


async def main():
    from database_engine import seed_lesson

    print("🌟 Starting Global Chapter 3 Import (Money & Numbers)...")
    for lesson_id, info in CHAPTER_3_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])
    print("🚀 All sub-lessons for Chapter 3 are synced! Word count in profile should increase.")


def get_lessons():
    return CHAPTER_3_DATA


if __name__ == "__main__":
    asyncio.run(main())
