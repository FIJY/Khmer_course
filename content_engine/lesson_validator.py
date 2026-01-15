from typing import Dict, List, Tuple


ALLOWED_TYPES = {"theory", "vocab_card", "quiz", "visual_decoder"}

REQUIRED_FIELDS = {
    "theory": ["title", "text"],
    "vocab_card": ["front", "back"],
    "quiz": ["question", "options", "correct_answer"],
    "visual_decoder": ["word", "target_char", "hint", "english_translation", "letter_series"],
}


def _is_blank(value: object) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def validate_lessons(lessons: Dict[int, dict], source: str) -> Tuple[List[str], List[str]]:
    errors: List[str] = []
    warnings: List[str] = []

    for lesson_id, lesson in lessons.items():
        title = lesson.get("title")
        desc = lesson.get("desc")
        content = lesson.get("content")

        if _is_blank(title):
            errors.append(f"[{source}] Lesson {lesson_id}: missing title.")
        if _is_blank(desc):
            warnings.append(f"[{source}] Lesson {lesson_id}: missing description.")
        if not isinstance(content, list) or not content:
            errors.append(f"[{source}] Lesson {lesson_id}: content must be a non-empty list.")
            continue

        for idx, item in enumerate(content):
            item_type = item.get("type")
            data = item.get("data", {})

            if item_type not in ALLOWED_TYPES:
                errors.append(
                    f"[{source}] Lesson {lesson_id} item {idx}: unsupported type '{item_type}'."
                )
                continue

            if not isinstance(data, dict):
                errors.append(f"[{source}] Lesson {lesson_id} item {idx}: data must be a dict.")
                continue

            for field in REQUIRED_FIELDS[item_type]:
                if _is_blank(data.get(field)):
                    errors.append(
                        f"[{source}] Lesson {lesson_id} item {idx} ({item_type}): missing '{field}'."
                    )

            if item_type == "quiz":
                options = data.get("options")
                correct = data.get("correct_answer")
                if not isinstance(options, list) or len(options) < 2:
                    errors.append(
                        f"[{source}] Lesson {lesson_id} item {idx} (quiz): options must be a list with 2+ items."
                    )
                elif correct not in options:
                    errors.append(
                        f"[{source}] Lesson {lesson_id} item {idx} (quiz): "
                        f"correct_answer must match one of the options."
                    )

            if item_type == "vocab_card":
                if _is_blank(data.get("pronunciation")):
                    warnings.append(
                        f"[{source}] Lesson {lesson_id} item {idx} (vocab_card): pronunciation is missing."
                    )
                if _is_blank(data.get("dictionary_id")) and _is_blank(data.get("audio")):
                    warnings.append(
                        f"[{source}] Lesson {lesson_id} item {idx} (vocab_card): "
                        "missing dictionary_id/audio reference."
                    )

            if item_type == "visual_decoder":
                word = data.get("word", "")
                target = data.get("target_char", "")
                if isinstance(word, str) and isinstance(target, str) and target not in word:
                    errors.append(
                        f"[{source}] Lesson {lesson_id} item {idx} (visual_decoder): "
                        f"target_char '{target}' is not in word '{word}'."
                    )
                if _is_blank(data.get("char_audio_map")):
                    warnings.append(
                        f"[{source}] Lesson {lesson_id} item {idx} (visual_decoder): "
                        "char_audio_map is missing or empty."
                    )

    return errors, warnings
