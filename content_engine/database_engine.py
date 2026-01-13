import os
import sys
import re
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv
import edge_tts
from pathlib import Path

# --- КОНФИГУРАЦИЯ ---
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Приоритет Service Role для удаления/записи
if not key:
    key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

VOICE = "km-KH-PisethNeural"
SPEED = "-10%"
# Путь к папке sounds в твоем React-проекте
AUDIO_DIR = Path(__file__).resolve().parent.parent / "khmer-mastery" / "public" / "sounds"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

if not url or not key:
    print(f"❌ ОШИБКА: Нет ключей Supabase в {env_path.absolute()}")
    sys.exit(1)

supabase: Client = create_client(url, key)


# --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

def get_item_type(khmer_text, english_text):
    """Определяет тип элемента для словаря (слово, фраза, число)"""
    clean = khmer_text.split(' (')[0].strip()
    if '?' in clean or clean.count(' ') >= 2: return 'sentence'
    if any(char.isdigit() for char in english_text): return 'number'
    if clean in ["សួស្តី", "ជំរាបសួរ", "អរគុណ", "បាទ", "ចាស"]: return 'phrase'
    return 'word'


async def generate_audio(text, filename):
    """Генерирует MP3 через Edge-TTS, если файла еще нет"""
    filepath = AUDIO_DIR / filename
    if filepath.exists(): return
    try:
        await edge_tts.Communicate(text, VOICE, rate=SPEED).save(filepath)
        print(f"   ✅ Audio created: {filename}")
    except Exception:
        pass  # Тихо пропускаем ошибки генерации


# --- ОСНОВНЫЕ ФУНКЦИИ ---

async def seed_lesson(lesson_id, title, desc, content_list, module_id=None, order_index=0):
    """
    Заливает урок в базу.
    Аргументы module_id и order_index обеспечивают правильное положение на карте.
    """
    print(f"🚀 Processing Lesson {lesson_id}: {title}...")

    # 1. UPSERT УРОКА (Обновляем заголовок, описание и привязку к модулю)
    lesson_data = {
        "id": lesson_id,
        "title": title,
        "description": desc,
        "module_id": module_id,  # Привязка к Главе (например, 1)
        "order_index": order_index  # Порядок внутри главы (0, 1, 2...)
    }

    try:
        supabase.table("lessons").upsert(lesson_data).execute()
    except Exception as e:
        print(f"   ❌ Ошибка записи в таблицу lessons: {e}")
        return

    # 2. ЧИСТКА СТАРЫХ КАРТОЧЕК (Чтобы избежать дублей и конфликтов)
    try:
        # Получаем ID существующих карточек этого урока
        existing = supabase.table("lesson_items").select("id").eq("lesson_id", lesson_id).execute()
        ids = [i['id'] for i in existing.data]

        if ids:
            # Удаляем связи в SRS (статистике пользователя), иначе база не даст удалить карточки
            try:
                supabase.table("user_srs").delete().in_("item_id", ids).execute()
            except:
                pass
            try:
                supabase.table("user_srs_items").delete().in_("item_id", ids).execute()
            except:
                pass

        # Удаляем сами карточки
        supabase.table("lesson_items").delete().eq("lesson_id", lesson_id).execute()
    except Exception as e:
        print(f"   ⚠️ Cleanup warning: {e}")

    # 3. ВСТАВКА НОВОГО КОНТЕНТА
    for idx, item in enumerate(content_list):
        # Если это словарная карточка или квиз, обрабатываем аудио и словарь
        if item['type'] in ['vocab_card', 'quiz']:
            khmer = item['data'].get('back') or item['data'].get('correct_answer')
            english = item['data'].get('front') or "Quiz Answer"

            # Очистка текста
            if khmer:
                clean_khmer = khmer.split(' (')[0].replace('?', '').strip()
                safe_english = re.sub(r'[\\/*?:"<>|]', "", english).lower().strip().replace(' ', '_')
                audio_name = f"{safe_english}.mp3"

                # Генерируем аудио
                await generate_audio(clean_khmer, audio_name)

                # Записываем в общий словарь (dictionary)
                dict_entry = {
                    "khmer": clean_khmer,
                    "english": english,
                    "pronunciation": item['data'].get('pronunciation', ''),
                    "item_type": get_item_type(clean_khmer, english)
                }
                # on_conflict="khmer" значит: если слово уже есть, обновим его перевод
                res = supabase.table("dictionary").upsert(dict_entry, on_conflict="khmer").execute()

                # Привязываем ID словаря и имя аудиофайла к карточке урока
                if res.data:
                    item['data']['dictionary_id'] = res.data[0]['id']
                item['data']['audio'] = audio_name

        # Вставляем карточку в урок
        try:
            supabase.table("lesson_items").insert({
                "lesson_id": lesson_id,
                "type": item['type'],
                "order_index": idx,
                "data": item['data']
            }).execute()
        except Exception as e:
            print(f"   ❌ Error inserting item {idx}: {e}")

    print(f"🎉 Lesson {lesson_id} synced!")


async def update_study_materials(module_id, lessons_data):
    """
    Собирает контент всех уроков и обновляет 'Книжечку' (study_materials) для главы.
    """
    print(f"\n📘 Updating Study Materials (Guidebook) for Module {module_id}...")

    summary_text = f"# Chapter Summary\n\n"

    for lesson_id, info in lessons_data.items():
        summary_text += f"## {info['title']}\n"

        # 1. Сначала правила (Theory)
        theory_found = False
        for item in info['content']:
            if item['type'] == 'theory':
                summary_text += f"* 💡 **{item['data']['title']}**: {item['data']['text']}\n"
                theory_found = True
        if theory_found: summary_text += "\n"

        # 2. Потом слова (Vocab)
        for item in info['content']:
            if item['type'] == 'vocab_card':
                khmer = item['data'].get('back', '')
                eng = item['data'].get('front', '')
                pron = item['data'].get('pronunciation', '')
                summary_text += f"* **{khmer}** ({pron}) — {eng}\n"

        summary_text += "\n"

    # Записываем в таблицу study_materials
    try:
        supabase.table("study_materials").upsert({
            "chapter_id": module_id,
            "title": f"Summary: Module {module_id}",
            "content": summary_text,
            "type": "summary"
        }, on_conflict="chapter_id").execute()
        print(f"✅ Study materials for Module {module_id} updated successfully!")
    except Exception as e:
        print(f"⚠️ Failed to update study_materials: {e}")
        print("   (Убедитесь, что таблица 'study_materials' создана в Supabase)")