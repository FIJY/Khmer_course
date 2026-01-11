import os
from supabase import create_client

# Настройки подключения
URL = "YOUR_SUPABASE_URL"
KEY = "YOUR_SUPABASE_KEY"
supabase = create_client(URL, KEY)


def get_item_type(khmer_text, english_text):
    """Определяет категорию для честного счета B1"""
    clean_khmer = khmer_text.split(' (')[0].strip()

    if '?' in clean_khmer or clean_khmer.count(' ') >= 2:
        return 'sentence'
    if any(char.isdigit() for char in english_text):
        return 'number'
    if clean_khmer in ["សួស្តី", "ជំរាបសួរ", "អរគុណ"]:
        return 'phrase'
    return 'word'


def seed_lesson(lesson_id, content_list):
    """Универсальная функция загрузки любого урока"""
    print(f"🚀 Seeding Lesson {lesson_id}...")

    for item in content_list:
        if item['type'] in ['vocab_card', 'quiz']:
            khmer = item['data'].get('back') or item['data'].get('correct_answer')
            english = item['data'].get('front') or "Quiz Answer"
            pron = item['data'].get('pronunciation', '')

            clean_khmer = khmer.split(' (')[0].strip()
            item_type = get_item_type(clean_khmer, english)

            # Сохраняем в словарь
            dict_entry = {
                "khmer": clean_khmer,
                "english": english,
                "pronunciation": pron,
                "item_type": item_type
            }

            res = supabase.table("dictionary").upsert(dict_entry, on_conflict="khmer").execute()
            word_id = res.data[0]['id']
            item['data']['dictionary_id'] = word_id

        # Сохраняем элемент урока
        supabase.table("lesson_items").insert({
            "lesson_id": lesson_id,
            "type": item['type'],
            "data": item['data']
        }).execute()

    print(f"✅ Lesson {lesson_id} completed!")