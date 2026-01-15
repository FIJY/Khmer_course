# Lesson Template (Beginner)

Use this structure when asking GPT to generate lesson content for `seed_lesson_X.py`.

## Prompt Template
```
You are generating a Python lesson content list for content_engine/seed_lesson_X.py.
Return only the list named content (no explanations).

Lesson theme: <THEME>
Level: Beginner (A0)
Alphabet focus: <TARGET_CHAR> (series <1|2>)
The lesson must include at least two words containing <TARGET_CHAR>.

Rules:
1) Minimum 5 items (aim for 7–9).
2) The final item must be a summary quiz that reviews ALL blocks in the lesson.
3) Quiz options and correct_answer must use only words from this lesson.
4) Include at least 2 vocab_card items and exactly 1 visual_decoder.
5) Keep blocks logically grouped by theme.
6) Add a cultural or usage note inside one theory block (field: culture_note).
7) If the lesson includes "yes/no" or polite replies, include both male and female variants.
8) Split the lesson into sub-lessons (2+), each with 5–20 vocab_card items.
9) For sub-lessons, add a sublesson_title field in the opening theory block.

Item formats:
- theory: {title, text, culture_note?, sublesson_title?}
- vocab_card: {front, back, pronunciation, audio}
- visual_decoder: {word, target_char, hint, english_translation, letter_series, word_audio, char_audio_map}
- quiz: {question, options, correct_answer, explanation?}

Return only this content list:
[
  {type: "...", data: {...}},
  ...
]
```

## Example Content Skeleton
```
[
  {"type": "theory", "data": {"title": "...", "text": "...", "culture_note": "..."}},
  {"type": "vocab_card", "data": {"front": "...", "back": "...", "pronunciation": "...", "audio": "..."}},
  {"type": "visual_decoder", "data": {"word": "...", "target_char": "...", "hint": "...", "english_translation": "...",
                                      "letter_series": 1, "word_audio": "...", "char_audio_map": {}}},
  {"type": "vocab_card", "data": {"front": "...", "back": "...", "pronunciation": "...", "audio": "..."}},
  {"type": "quiz", "data": {"question": "...", "options": ["...","..."], "correct_answer": "...", "explanation": "..."}},
  {"type": "vocab_card", "data": {"front": "...", "back": "...", "pronunciation": "...", "audio": "..."}},
  {"type": "quiz", "data": {"question": "Summary: ...", "options": ["...","...","..."], "correct_answer": "..."}}
]
```
