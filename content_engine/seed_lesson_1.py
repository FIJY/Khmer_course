import asyncio
from database_engine import seed_lesson, update_study_materials

# ПОЛНЫЙ КОНТЕНТ ГЛАВЫ 1 (Все 3 урока)
CHAPTER_1_DATA = {
    # ------------------------------------------------------------------
    # LESSON 1.1: HELLO (Target: ស - Sa)
    # ------------------------------------------------------------------
    101: {
        "title": "Lesson 1.1: Hello",
        "desc": "Greeting basics & The First Letter.",
        "module_id": 1,
        "order_index": 0,
        "content": [
            {"type": "theory", "data": {"title": "The Alphabet",
                                        "text": "Khmer consonants are divided into two series: A-Series (Sun ☀️) and O-Series (Moon 🌙). This changes how vowels sound!"}},
            {"type": "vocab_card",
             "data": {"front": "Hello", "back": "សួស្តី", "pronunciation": "Suəs-dey", "audio": "hello.mp3"}},

            # VISUAL DECODER: Sa
            {
                "type": "visual_decoder",
                "data": {
                    "word": "សួស្តី",
                    "target_char": "ស",
                    "hint": "Find character: Sa (Series 1)",
                    "english_translation": "Hello (Suas-dey)",
                    "letter_audio": "letter_sa.mp3",
                    "letter_series": 1,
                    "word_audio": "hello.mp3"
                }
            },
            {"type": "vocab_card",
             "data": {"front": "Hello (Formal)", "back": "ជំរាបសួរ", "pronunciation": "Cum-riəp Suə",
                      "audio": "hello_formal.mp3"}},
            {"type": "vocab_card",
             "data": {"front": "I / Me", "back": "ខ្ញុំ", "pronunciation": "Kɲom", "audio": "i_me.mp3"}},
            {"type": "vocab_card",
             "data": {"front": "You", "back": "អ្នក", "pronunciation": "Neak", "audio": "you.mp3"}},
            {"type": "quiz",
             "data": {"question": "Informal Hello?", "options": ["សួស្តី", "ជំរាបសួរ"], "correct_answer": "សួស្តី"}}
        ]
    },

    # ------------------------------------------------------------------
    # LESSON 1.2: MANNERS (Target: ក - Ka)
    # ------------------------------------------------------------------
    102: {
        "title": "Lesson 1.2: Manners",
        "desc": "Being polite & The 'House' Letter.",
        "module_id": 1,
        "order_index": 1,
        "content": [
            {"type": "theory", "data": {"title": "Politeness",
                                        "text": "To be polite, men add 'Baat' and women add 'Jaa' at the end of sentences."}},
            {"type": "vocab_card",
             "data": {"front": "Thank you", "back": "អរគុណ", "pronunciation": "Arkun", "audio": "thank_you.mp3"}},

            # VISUAL DECODER: Ka (В середине слова Arkun)
            {
                "type": "visual_decoder",
                "data": {
                    "word": "អរគុណ",
                    "target_char": "ក",
                    "hint": "Find character: Ka (Series 1)",
                    "english_translation": "Thank You (Arkun)",
                    "letter_audio": "letter_ka.mp3",
                    "letter_series": 1,
                    "word_audio": "thank_you.mp3"
                }
            },
            {"type": "vocab_card",
             "data": {"front": "Sorry", "back": "សូមទោស", "pronunciation": "Soum Toh", "audio": "sorry.mp3"}},
            {"type": "quiz",
             "data": {"question": "How to say Thank You?", "options": ["អរគុណ", "សូមទោស"], "correct_answer": "អរគុណ"}}
        ]
    },

    # ------------------------------------------------------------------
    # LESSON 1.3: YES & NO (Target: ប - Ba)
    # ------------------------------------------------------------------
    103: {
        "title": "Lesson 1.3: Yes / No",
        "desc": "Agreement & The 'Bucket' Letter.",
        "module_id": 1,
        "order_index": 2,
        "content": [
            {"type": "theory", "data": {"title": "Negation",
                                        "text": "To say NO, put 'Min' before the verb and 'Te' after. Example: Min...Te."}},

            # VISUAL DECODER: Ba (В слове Baat)
            {
                "type": "visual_decoder",
                "data": {
                    "word": "បាទ",
                    "target_char": "ប",
                    "hint": "Find character: Ba (Series 1)",
                    "english_translation": "Yes (Male)",
                    "letter_audio": "letter_ba.mp3",
                    "letter_series": 1,
                    "word_audio": "yes_male.mp3"
                }
            },
            {"type": "vocab_card",
             "data": {"front": "Yes (Male)", "back": "បាទ", "pronunciation": "Baat", "audio": "yes_male.mp3"}},
            {"type": "vocab_card",
             "data": {"front": "Yes (Female)", "back": "ចាស", "pronunciation": "Jaa", "audio": "yes_female.mp3"}},
            {"type": "vocab_card", "data": {"front": "No", "back": "ទេ", "pronunciation": "Te", "audio": "no.mp3"}},
            {"type": "vocab_card", "data": {"front": "I am NOT fine", "back": "ខ្ញុំមិនសុខសប្បាយទេ",
                                            "pronunciation": "Knhom min sok-sabay te", "audio": "not_fine.mp3"}},
            {"type": "quiz", "data": {"question": "Yes (for men)?", "options": ["បាទ", "ចាស"], "correct_answer": "បាទ"}}
        ]
    }
}


async def main():
    print("🌟 Восстановление ГЛАВЫ 1 (Все 3 урока)...")
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(
            lesson_id, info["title"], info["desc"], info["content"],
            module_id=info["module_id"], order_index=info["order_index"]
        )
    await update_study_materials(1, CHAPTER_1_DATA)
    print("🚀 Все уроки (1.1, 1.2, 1.3) успешно восстановлены в базе!")


if __name__ == "__main__":
    asyncio.run(main())