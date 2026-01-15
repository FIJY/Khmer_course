import argparse
import asyncio
import json
from pathlib import Path

from database_engine import seed_lesson, update_study_materials


def load_content(content_path: Path):
    if not content_path.exists():
        raise FileNotFoundError(f"Content file not found: {content_path}")
    with content_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def ask_for_content_file(base_dir: Path) -> Path:
    """
    Interactive picker for a JSON file.
    Looks for *.json in base_dir and asks the user to choose one.
    """
    base_dir = base_dir.resolve()
    json_files = sorted(base_dir.glob("*.json"))

    if not json_files:
        raise FileNotFoundError(f"No JSON files found in: {base_dir}")

    print(f"Select a content file from: {base_dir}")
    for i, f in enumerate(json_files, start=1):
        print(f"  {i}. {f.name}")

    while True:
        choice = input("Enter number: ").strip()
        if choice.isdigit():
            idx = int(choice) - 1
            if 0 <= idx < len(json_files):
                return json_files[idx]
        print("Invalid choice. Try again.")


async def async_main():
    parser = argparse.ArgumentParser(
        description="Seed a lesson using a JSON payload or a JSON content list."
    )
    parser.add_argument("--lesson-id", help="Lesson id (e.g., 101)")
    parser.add_argument("--title", help="Lesson title")
    parser.add_argument("--desc", help="Lesson description")
    parser.add_argument(
        "--content",
        help="Path to JSON file with lesson payload OR content list. If omitted, you'll be prompted to choose a file.",
    )
    parser.add_argument(
        "--content-dir",
        default="content_json",
        help="Directory to search for JSON files when --content is omitted (default: content_json)",
    )
    parser.add_argument("--module-id", type=int, help="Module id (chapter)")
    parser.add_argument("--order-index", type=int, help="Lesson order in module")
    parser.add_argument(
        "--update-summary",
        action="store_true",
        help="Update study materials summary for the module",
    )

    args = parser.parse_args()

    if args.content:
        content_path = Path(args.content)
    else:
        content_path = ask_for_content_file(Path(args.content_dir))

    payload = load_content(content_path)

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
        raise ValueError(
            "Content JSON must be a list of lesson items (or a payload dict with a 'content' list)."
        )

    if lesson_id is None or title is None or desc is None:
        raise ValueError(
            "Missing lesson metadata. Provide --lesson-id/--title/--desc or include them in the JSON payload."
        )

    lesson_id = int(lesson_id)

    await seed_lesson(
        lesson_id,
        title,
        desc,
        content,
        module_id=module_id,
        order_index=order_index,
    )

    if args.update_summary and module_id is not None:
        await update_study_materials(
            module_id,
            {
                lesson_id: {
                    "title": title,
                    "desc": desc,
                    "content": content,
                }
            },
        )


def main():
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
