# Lesson Template (Beginner)

Use this template directly in GPT. You can edit the placeholders by hand.

## GPT Prompt Template (copy/paste)
```
You are generating a JSON lesson content list for a single lesson.
Return ONLY the content list (no explanations, no Markdown, no code fences).

Lesson number: <LESSON_NUMBER> (example: 1)
Sub-lesson ids: <SUBLESSON_IDS> (example: 101, 102, 103)
Lesson theme: <THEME>
Level: Beginner (A0)
Alphabet focus: <TARGET_CHAR_OR_WORDS> (can be multiple, e.g., ["ន", "ម"] or "auto")
The lesson must include at least two words containing each provided target character.

Rules:
1) Split the lesson into sub-lessons (2+). You may choose how many sub-lessons based on the theme.
2) Each sub-lesson must end with a quiz.
3) The final item must be a summary quiz that reviews ALL blocks in the lesson (words + theory + any extra notes).
4) Quiz options and correct_answer must use only words from this lesson.
5) Include at least 2 vocab_card items and exactly 1 visual_decoder for the full lesson.
6) Keep blocks logically grouped by theme.
7) Add a cultural or usage note inside one theory block (field: culture_note).
8) If the lesson includes “yes/no” or polite replies, include both male and female variants.
9) For sub-lessons, add a sublesson_title field in the opening theory block.
10) All text must be in English (except Khmer words themselves).

Item formats:
- theory: {title, text, culture_note?, sublesson_title?}
- vocab_card: {front, back, pronunciation, audio}
- visual_decoder: {word, target_char, hint, english_translation, letter_series, word_audio, char_audio_map}
- quiz: {question, options, correct_answer, explanation?}

Return ONLY this content list:
[
  {"type": "...", "data": {...}},
  ...
]
```

## Example Content Skeleton
```
[
  {"type": "theory", "data": {"title": "...", "text": "...", "culture_note": "...", "sublesson_title": "..."}},
  {"type": "vocab_card", "data": {"front": "English", "back": "Khmer", "pronunciation": "phonetic", "audio": ""}},
  {"type": "visual_decoder", "data": {"word": "...", "target_char": "...", "hint": "...", "english_translation": "...",
                                      "letter_series": "unknown", "word_audio": "", "char_audio_map": {}}},
  {"type": "vocab_card", "data": {"front": "English", "back": "Khmer", "pronunciation": "phonetic", "audio": ""}},
  {"type": "quiz", "data": {"question": "...", "options": ["...","..."], "correct_answer": "...", "explanation": "..."}},
  {"type": "vocab_card", "data": {"front": "English", "back": "Khmer", "pronunciation": "phonetic", "audio": ""}},
  {"type": "quiz", "data": {"question": "Summary: ...", "options": ["...","...","..."], "correct_answer": "..."}}
]
```

## Notes
- Use `letter_series: "unknown"` for vowels/diacritics or when the series is not known.
- Audio fields can be left blank; audio will be generated later by the import script.
