import asyncio

import seed_lesson_1
import seed_lesson_2
import seed_lesson_3
import seed_lesson_4
from lesson_validator import validate_lessons


async def main():
    datasets = {
        "seed_lesson_1": await seed_lesson_1.get_lessons(include_audio_map=False),
        "seed_lesson_2": seed_lesson_2.get_lessons(),
        "seed_lesson_3": seed_lesson_3.get_lessons(),
        "seed_lesson_4": seed_lesson_4.get_lessons(),
    }

    all_errors = []
    all_warnings = []

    for source, lessons in datasets.items():
        errors, warnings = validate_lessons(lessons, source)
        all_errors.extend(errors)
        all_warnings.extend(warnings)

    if all_errors:
        print("❌ Content errors found:")
        for err in all_errors:
            print(f"  - {err}")
    else:
        print("✅ No blocking content errors found.")

    if all_warnings:
        print("\n⚠️ Warnings:")
        for warning in all_warnings:
            print(f"  - {warning}")

    if all_errors:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
