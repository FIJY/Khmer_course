import argparse
import asyncio
import json
import sys
from pathlib import Path

from database_engine import seed_lesson, update_study_materials


def load_content(content_path: Path):
    """Загружает JSON контент из файла."""
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
        print(f"❌ ОШИБКА: Нет JSON файлов в папке: {base_dir}")
        print(f"   Создай JSON файл в: {base_dir}/")
        sys.exit(1)

    print(f"\n📂 Выбери JSON файл из папки: {base_dir}")
    for i, f in enumerate(json_files, start=1):
        print(f"   {i}. {f.name}")

    while True:
        try:
            choice = input("\n👉 Введи номер (число): ").strip()
            if choice.isdigit():
                idx = int(choice) - 1
                if 0 <= idx < len(json_files):
                    selected = json_files[idx]
                    print(f"   ✅ Выбран: {selected.name}\n")
                    return selected
            print("   ❌ Неверный выбор. Попробуй ещё раз.")
        except KeyboardInterrupt:
            print("\n⚠️ Отмена. Выход.")
            sys.exit(0)
        except Exception as e:
            print(f"   ❌ Ошибка ввода: {e}")


async def async_main():
    print("\n" + "=" * 60)
    print("🚀 KHMER LESSON SEEDER - Загрузчик уроков")
    print("=" * 60 + "\n")

    parser = argparse.ArgumentParser(
        description="Загружает урок из JSON файла в базу данных и генерирует аудио."
    )
    parser.add_argument("--lesson-id", help="ID урока (например, 101)")
    parser.add_argument("--title", help="Название урока")
    parser.add_argument("--desc", help="Описание урока")
    parser.add_argument(
        "--content",
        help="Путь к JSON файлу с уроком. Если не указан — будет интерактивный выбор.",
    )
    parser.add_argument(
        "--content-dir",
        default="content_json",
        help="Папка с JSON файлами (по умолчанию: content_json)",
    )
    parser.add_argument("--module-id", type=int, help="ID модуля (главы)")
    parser.add_argument("--order-index", type=int, help="Порядок урока в модуле")
    parser.add_argument(
        "--update-summary",
        action="store_true",
        help="Обновить сводку study_materials для модуля",
    )

    args = parser.parse_args()

    # Pick content file path (explicit or interactive)
    if args.content:
        content_path = Path(args.content)
        print(f"📄 JSON файл: {content_path.resolve()}")
    else:
        print(f"📂 Интерактивный выбор файла...")
        content_path = ask_for_content_file(Path(args.content_dir))

    print(f"⏳ Загружаю JSON файл...\n")

    try:
        payload = load_content(content_path)
    except Exception as e:
        print(f"❌ ОШИБКА при загрузке JSON: {e}")
        sys.exit(1)

    lessons_to_process = []

    # 1. Проверяем: это вся глава или один урок?
    if isinstance(payload, dict) and "lessons" in payload:
        print(f"📚 Обнаружена глава JSON: {payload.get('title', 'No title')}")
        lessons_to_process = payload.get("lessons", [])
        chapter_id = payload.get("chapter_id") or payload.get("id")
    elif isinstance(payload, dict):
        # Если в файле один урок
        print(f"📖 Обнаружен одиночный урок JSON")
        lessons_to_process = [payload]
        chapter_id = None
    else:
        # Если просто список [{}, {}]
        print(f"📋 Обнаружен список контента")
        lessons_to_process = [{"content": payload}]
        chapter_id = None

    if not lessons_to_process:
        print("❌ ОШИБКА: В JSON файле нет уроков для обработки.")
        sys.exit(1)

    print(f"📌 К обработке: {len(lessons_to_process)} урок(ов)\n")

    # 2. ЗАПУСКАЕМ ЦИКЛ ПО ВСЕМ НАЙДЕННЫМ УРОКАМ
    processed_count = 0

    for lesson_idx, lesson_data in enumerate(lessons_to_process, 1):
        content = lesson_data.get("content")
        lesson_id = args.lesson_id or lesson_data.get("lesson_id")
        title = args.title or lesson_data.get("title")
        desc = args.desc or lesson_data.get("desc")

        # Определяем ID главы (module_id)
        module_id = args.module_id or lesson_data.get("module_id") or chapter_id
        order_index = args.order_index if args.order_index is not None else lesson_data.get("order_index",
                                                                                            lesson_idx - 1)

        if not content:
            print(f"⚠️ Урок {lesson_idx}: Нет контента, пропускаю")
            continue

        if not lesson_id:
            print(f"⚠️ Урок {lesson_idx}: Нет lesson_id, пропускаю")
            continue

        # Загружаем текущий урок
        try:
            await seed_lesson(
                int(lesson_id),
                title or f"Lesson {lesson_id}",
                desc or "",
                content,
                module_id=module_id,
                order_index=order_index,
            )
            processed_count += 1
        except Exception as e:
            print(f"❌ ОШИБКА при обработке урока {lesson_id}: {e}")
            continue

    # 3. Обновляем итоговую книжечку для всей главы
    if args.update_summary and module_id is not None:
        print(f"\n🔄 Обновляю study_materials для модуля {module_id}...")
        # Собираем данные всех уроков для суммаризации
        summary_payload = {int(l["lesson_id"]): l for l in lessons_to_process if "lesson_id" in l}
        try:
            await update_study_materials(module_id, summary_payload)
        except Exception as e:
            print(f"⚠️ Не удалось обновить study_materials: {e}")

    # 4. Финальный отчёт
    print("\n" + "=" * 60)
    if processed_count == len(lessons_to_process):
        print(f"✅ УСПЕХ! Загружено {processed_count}/{len(lessons_to_process)} уроков")
    else:
        print(f"⚠️ Частичный успех: Загружено {processed_count}/{len(lessons_to_process)} уроков")
    print("=" * 60 + "\n")


def main():
    try:
        asyncio.run(async_main())
    except KeyboardInterrupt:
        print("\n\n⚠️ Прервано пользователем.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ КРИТИЧЕСКАЯ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()