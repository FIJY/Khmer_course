import argparse
from textwrap import dedent


def build_prompt(
    lesson_number: str,
    sublesson_ids: str,
    theme: str,
    target_char: str,
    series: str,
    sublesson_count: int,
    vocab_min: int,
    vocab_max: int,
    notes: str,
):
    notes_block = f"\nAdditional notes:\n- {notes.strip()}\n" if notes.strip() else ""
    return dedent(
        f"""
        You are generating a Python lesson content list for content_engine/seed_lesson_X.py.
        Return only the list named content (no explanations).

        Lesson number: {lesson_number}
        Sub-lesson ids: {sublesson_ids}
        Lesson theme: {theme}
        Level: Beginner (A0)
        Alphabet focus: {target_char} (series {series})
        Sub-lessons required: {sublesson_count}
        Vocab per sub-lesson: {vocab_min}–{vocab_max} words
        The lesson must include at least two words containing {target_char}.
        {notes_block}
        Rules:
        1) Minimum 5 items overall (aim for 7–9 per sub-lesson plus a final summary quiz).
        2) The final item must be a summary quiz that reviews ALL sub-lessons.
        3) Quiz options and correct_answer must use only words from this lesson.
        4) Include at least 2 vocab_card items and exactly 1 visual_decoder in the full lesson.
        5) Keep blocks logically grouped by sub-lesson themes.
        6) Add a cultural or usage note inside one theory block (field: culture_note).
        7) If the lesson includes "yes/no" or polite replies, include both male and female variants.
        8) If the target is a vowel/diacritic/unknown, keep letter_series as "unknown".

        Sub-lesson structure guidance:
        - Start each sub-lesson with a theory block that includes a sublesson_title field.
        - Follow with {vocab_min}–{vocab_max} vocab_card items.
        - Add a short quiz for the sub-lesson.

        Item formats:
        - theory: {{title, text, culture_note?, sublesson_title?}}
        - vocab_card: {{front, back, pronunciation, audio}}
        - visual_decoder: {{word, target_char, hint, english_translation, letter_series, word_audio, char_audio_map}}
        - quiz: {{question, options, correct_answer, explanation?}}

        Return only this content list:
        [
          {{type: "...", data: {{...}}}},
          ...
        ]
        """
    ).strip()


def main():
    parser = argparse.ArgumentParser(
        description="Generate a GPT prompt for a seed_lesson content list."
    )
    parser.add_argument("--lesson-number", required=True, help="Main lesson number (e.g., 1)")
    parser.add_argument(
        "--sublesson-ids",
        required=True,
        help="Comma-separated sub-lesson ids (e.g., 101,102,103)",
    )
    parser.add_argument("--theme", required=True, help="Lesson theme")
    parser.add_argument("--target-char", required=True, help="Khmer character to focus on")
    parser.add_argument(
        "--series",
        default="unknown",
        choices=["1", "2", "vowel", "diacritic", "unknown"],
        help="Letter series (or vowel/diacritic/unknown)",
    )
    parser.add_argument(
        "--sublessons",
        type=int,
        default=2,
        help="Number of sub-lessons required",
    )
    parser.add_argument(
        "--vocab-min",
        type=int,
        default=10,
        help="Minimum vocab words per sub-lesson",
    )
    parser.add_argument(
        "--vocab-max",
        type=int,
        default=20,
        help="Maximum vocab words per sub-lesson",
    )
    parser.add_argument(
        "--notes",
        default="",
        help="Extra guidance to include in the GPT prompt",
    )

    args = parser.parse_args()
    print(
        build_prompt(
            lesson_number=args.lesson_number,
            sublesson_ids=args.sublesson_ids,
            theme=args.theme,
            target_char=args.target_char,
            series=args.series,
            sublesson_count=args.sublessons,
            vocab_min=args.vocab_min,
            vocab_max=args.vocab_max,
            notes=args.notes,
        )
    )


if __name__ == "__main__":
    main()
