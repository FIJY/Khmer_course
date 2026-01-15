import argparse
import json
from pathlib import Path

from database_engine import seed_lesson, update_study_materials


def load_content(content_path: Path):
    if not content_path.exists():
        raise FileNotFoundError(f"Content file not found: {content_path}")
    with content_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main():
    parser = argparse.ArgumentParser(
        description="Seed a lesson using a JSON content list."
    )
    parser.add_argument("--lesson-id", help="Lesson id (e.g., 101)")
    parser.add_argument("--title", help="Lesson title")
    parser.add_argument("--desc", help="Lesson description")
    parser.add_argument(
        "--content",
        help="Path to JSON file with content list",
    )
    parser.add_argument("--module-id", type=int, help="Module id (chapter)")
    parser.add_argument("--order-index", type=int, help="Lesson order in module")
    parser.add_argument(
        "--update-summary",
        action="store_true",
        help="Update study materials summary for the module",
    )

    args = parser.parse_args()

    content_path = args.content
    if not content_path:
        content_path = input("Enter path to lesson JSON: ").strip()
        if not content_path:
            raise ValueError("Missing content file path.")

    payload = load_content(Path(content_path))

    if isinstance(payload, dict):
        content = payload.get("content")
        lesson_id = args.lesson_id or payload.get("lesson_id")
        title = args.title or payload.get("title")
        desc = args.desc or payload.get("desc")
        module_id = args.module_id if args.module_id is not None else payload.get("module_id")
        order_index = (
            args.order_index
            if args.order_index is not None
            else payload.get("order_index", 0)
        )
    else:
        content = payload
        lesson_id = args.lesson_id
        title = args.title
        desc = args.desc
        module_id = args.module_id
        order_index = args.order_index if args.order_index is not None else 0

    if not isinstance(content, list):
        raise ValueError("Content JSON must be a list of lesson items.")

    if lesson_id is None or title is None or desc is None:
        raise ValueError(
            "Missing lesson metadata. Provide --lesson-id/--title/--desc or include them in the JSON."
        )

    lesson_id = int(lesson_id)

    seed_lesson(
        lesson_id,
        title,
        desc,
        content,
        module_id=module_id,
        order_index=order_index,
    )

    if args.update_summary and module_id is not None:
        update_study_materials(
            module_id,
            {
                lesson_id: {
                    "title": title,
                    "desc": desc,
                    "content": content,
                }
            },
        )


if __name__ == "__main__":
    main()
