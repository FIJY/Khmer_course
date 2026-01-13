import asyncio
from database_engine import seed_lesson, update_study_materials  # Импортируем новую функцию

CHAPTER_1_DATA = {
    101: {
        "title": "Lesson 1.1: Hello",
        "desc": "Basics of greeting.",
        "module_id": 1,  # Добавляем привязку к модулю
        "content": [
            {"type": "theory", "data": {"title": "Components", "text": "Khmer words are built from smaller parts."}},
            {"type": "vocab_card", "data": {"front": "Hello", "back": "សួស្តី", "pronunciation": "Suəs-dey"}},
            {"type": "quiz", "data": {"question": "Hello?", "options": ["សួស្តី", "ទេ"], "correct_answer": "សួស្តី"}}
        ]
    },
    # ... остальные уроки (102, 103) ...
}


async def main():
    print("🌟 Запуск формирования уроков...")

    # 1. Заливаем все уроки по очереди
    for lesson_id, info in CHAPTER_1_DATA.items():
        await seed_lesson(lesson_id, info["title"], info["desc"], info["content"])

    # 2. АВТОМАТИЧЕСКИ обновляем книжечку для Главы 1
    # Мы берем module_id из первого попавшегося урока
    first_lesson = list(CHAPTER_1_DATA.values())[0]
    module_id = first_lesson.get("module_id", 1)

    await update_study_materials(module_id, CHAPTER_1_DATA)

    print("🚀 Все готово: уроки на карте, конспект в книжечке!")


if __name__ == "__main__":
    asyncio.run(main())