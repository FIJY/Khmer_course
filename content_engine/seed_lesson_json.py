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
    parser.add_argument("--lesson-id", required=True, help="Lesson id (e.g., 101)")
    parser.add_argument("--title", required=True, help="Lesson title")
    parser.add_argument("--desc", required=True, help="Lesson description")
    parser.add_argument(
        "--content",
        required=True,
        help="Path to JSON file with content list",
    )
    parser.add_argument("--module-id", type=int, help="Module id (chapter)")
    parser.add_argument("--order-index", type=int, default=0, help="Lesson order in module")
    parser.add_argument(
        "--update-summary",
        action="store_true",
        help="Update study materials summary for the module",
    )

    args = parser.parse_args()
    content = load_content(Path(args.content))

    if not isinstance(content, list):
        raise ValueError("Content JSON must be a list of lesson items.")

    lesson_id = int(args.lesson_id)
    module_id = args.module_id

    seed_lesson(
        lesson_id,
        args.title,
        args.desc,
        content,
        module_id=module_id,
        order_index=args.order_index,
    )

    if args.update_summary and module_id is not None:
        update_study_materials(
            module_id,
            {
                lesson_id: {
                    "title": args.title,
                    "desc": args.desc,
                    "content": content,
                }
            },
        )


if __name__ == "__main__":
    main()
