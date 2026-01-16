import os
import json
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Подключаемся
load_dotenv()
url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not url or not key:
    print("❌ Нет ключей в .env")
    exit()

supabase = create_client(url, key)


def check_lesson_103():
    print("🔍 Проверяем данные для Урока 103 (Финальный квиз)...\n")

    # 1. Запрашиваем элементы урока из базы
    response = supabase.table("lesson_items").select("*").eq("lesson_id", 103).execute()
    items = response.data

    if not items:
        print("❌ Урок 103 пуст! В таблице lesson_items нет записей.")
        return

    print(f"✅ Найдено элементов: {len(items)}")

    # Берем первый попавшийся квиз для детального разбора
    quiz_item = None
    for item in items:
        if item['type'] == 'quiz':
            quiz_item = item
            break

    if not quiz_item:
        print("❌ В уроке 103 нет квизов!")
        return

    # 2. Анализируем структуру данных
    data = quiz_item['data']
    question = data.get('question', 'No question')
    options = data.get('options', [])
    metadata = data.get('options_metadata', {})

    print(f"\n📝 Пример вопроса: {question}")
    print("-" * 40)

    # 3. Проверяем каждый вариант ответа
    for opt in options:
        print(f"\n🔹 Вариант: [{opt}]")

        # Проверяем наличие метаданных
        if opt in metadata:
            meta = metadata[opt]
            pron = meta.get('pronunciation', 'ПУСТО ❌')
            audio = meta.get('audio', 'ПУСТО ❌')

            print(f"   🎙 Аудио файл: {audio}")
            print(f"   🗣 Транскрипция: {pron}")

            if pron == 'ПУСТО ❌' or pron == "":
                print("   ⚠️ ВНИМАНИЕ: Поле транскрипции есть, но оно пустое!")
        else:
            print("   ❌ CRITICAL: Для этого варианта нет записи в options_metadata!")

    # 4. Проверяем словарь для одного слова
    first_opt_clean = options[0].split(' (')[0].strip()
    print(f"\n📚 Проверка словаря для слова '{first_opt_clean}':")
    dict_res = supabase.table("dictionary").select("*").eq("khmer", first_opt_clean).execute()
    if dict_res.data:
        print(f"   В словаре найдено: {dict_res.data[0].get('pronunciation', 'Нет транскрипции')}")
    else:
        print("   ❌ Слова нет в таблице dictionary!")


if __name__ == "__main__":
    check_lesson_103()