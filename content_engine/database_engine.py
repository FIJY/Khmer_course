async def seed_lesson(lesson_id, title, desc, content_list):
    print(f"🚀 Processing Lesson {lesson_id}: {title}...")
    supabase.table("lessons").upsert({"id": lesson_id, "title": title, "description": desc}).execute()
    supabase.table("lesson_items").delete().eq("lesson_id", lesson_id).execute()

    for idx, item in enumerate(content_list):
        if item['type'] in ['vocab_card', 'quiz']:
            khmer = item['data'].get('back') or item['data'].get('correct_answer')
            english = item['data'].get('front') or "Quiz Answer"

            # Очищаем слово и создаем имя файла
            clean_khmer = khmer.split(' (')[0].strip()
            audio_name = f"{clean_khmer}.mp3"

            await generate_audio(clean_khmer, audio_name)

            # Сохраняем в Master Dictionary
            dict_entry = {
                "khmer": clean_khmer,
                "english": english,
                "pronunciation": item['data'].get('pronunciation', ''),
                "item_type": get_item_type(clean_khmer, english)
            }
            # Получаем ID созданного/найденного слова
            res = supabase.table("dictionary").upsert(dict_entry, on_conflict="khmer").execute()

            item['data']['dictionary_id'] = res.data[0]['id']
            item['data']['audio'] = audio_name
            print(f"   🔹 Linked: {clean_khmer} -> ID: {res.data[0]['id']}")

        supabase.table("lesson_items").insert({
            "lesson_id": lesson_id, "type": item['type'], "order_index": idx, "data": item['data']
        }).execute()