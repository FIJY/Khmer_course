import asyncio

import seed_lesson_1
import seed_lesson_2
import seed_lesson_3
import seed_lesson_4
from database_engine import seed_lesson, update_study_materials
from lesson_validator import validate_lessons


async def main():
    datasets = {
        "seed_lesson_1": await seed_lesson_1.get_lessons(include_audio_map=True),
        "seed_lesson_2": seed_lesson_2.get_lessons(),
        "seed_lesson_3": seed_lesson_3.get_lessons(),
        "seed_lesson_4": seed_lesson_4.get_lessons(),
    }

    all_errors = []
    for source, lessons in datasets.items():
        errors, _ = validate_lessons(lessons, source)
        all_errors.extend(errors)

    if all_errors:
        print("❌ Fix lesson content errors before seeding:")
        for err in all_errors:
            print(f"  - {err}")
        raise SystemExit(1)

    for lessons in datasets.values():
        for lesson_id, info in lessons.items():
            await seed_lesson(
                lesson_id,
                info["title"],
                info.get("desc", ""),
                info["content"],
                module_id=info.get("module_id"),
                order_index=info.get("order_index", 0),
            )

    module_1_data = datasets.get("seed_lesson_1")
    if module_1_data:
        await update_study_materials(1, module_1_data)

    print("✅ All lessons seeded successfully.")


if __name__ == "__main__":
    asyncio.run(main())
