import os
import sys
import re
import asyncio
import hashlib
import time
from supabase import create_client, Client
from dotenv import load_dotenv
import edge_tts
from pathlib import Path

# --- КОНФИГУРАЦИЯ ---
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not key:
    key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

VOICE = "km-KH-PisethNeural"
SPEED = "-10%"
KHMER_PATTERN = re.compile(r"[\u1780-\u17FF]")

AUDIO_DIR = Path(__file__).resolve().parent.parent / "khmer-mastery" / "public" / "sounds"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# НЕ генерим такие префиксы (у тебя уже есть готовые ассеты)
SKIP_AUDIO_PREFIXES = ("letter_",)

if not url or not key:
    print(f"❌ ОШИБКА: Нет ключей Supabase в {env_path.absolute()}")
    sys.exit(1)

supabase: Client = create_client(url, key)


# --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

def db_execute_retry(query, retries=5, delay=2):
    """Выполняет запрос с повторными попытками (спасает от 502 error)"""
    last_error = None
    for attempt in range(retries):
        try:
            return query.execute()
        except Exception as e:
            last_error = e
            err_str = str(e)
            if "Network" in err_str or "502" in err_str or "500" in err_str or "connection" in err_str.lower():
                print(f"   ⚠️ DB Network error (попытка {attempt + 1}/{retries}), ждем {delay} сек...")
                time.sleep(delay)
            else:
                raise e
    print(f"❌ Не удалось выполнить запрос после {retries} попыток.")
    raise last_error


def ensure_mp3(name: str) -> str:
    """Нормализует имя аудиофайла: добавляет .mp3 если расширения нет."""
    name = (name or "").strip()
    if not name:
        return name
    if re.search(r"\.[a-z0-9]{2,5}$", name, re.IGNORECASE):
        return name
    return f"{name}.mp3"


def should_skip_generation(audio_key: str) -> bool:
    """Возвращает True если это пред-собранный ассет и его генерить не надо."""
    if not audio_key:
        return True
    for p in SKIP_AUDIO_PREFIXES:
        if audio_key.startswith(p):
            return True
    return False


def get_safe_audio_name(khmer_text, english_label=None, item_type="word"):
    clean_k = khmer_text.split(' (')[0].replace('?', '').strip()
    base_label = english_label or item_type
    safe_label = re.sub(r'[\\/*?:"<>|]', "", base_label).lower().strip().replace(' ', '_')[:16]
    w_hash = hashlib.md5(clean_k.encode()).hexdigest()[:6]
    return f"{safe_label}_{w_hash}.mp3"


def get_item_type(khmer_text, english_text):
    clean = khmer_text.split(' (')[0].strip()
    if '?' in clean or clean.count(' ') >= 2:
        return 'sentence'
    if any(char.isdigit() for char in (english_text or "")):
        return 'number'
    return 'word'


async def generate_audio(text, filename):
    """Генерирует аудиофайл с помощью TTS"""
    filename = ensure_mp3(filename)
    filepath = AUDIO_DIR / filename

    if filepath.exists():
        return

    clean_text = text.split(' (')[0].replace('?', '').strip()
    if not clean_text:
        return

    try:
        await edge_tts.Communicate(clean_text, VOICE, rate=SPEED).save(filepath)
        print(f"   ✅ Audio created: {filename}")
    except Exception as e:
        print(f"   ⚠️ TTS Error for {filename}: {e}")
        if filepath.exists():
            filepath.unlink()


# --- ОСНОВНЫЕ ФУНКЦИИ ---

async def seed_lesson(lesson_id, title, desc, content_list, module_id=None, order_index=0):
    """Загружает урок в БД с генерацией озвучки"""
    print(f"\n🚀 Processing Lesson {lesson_id}: {title}...")

    # 1. UPSERT УРОКА
    db_execute_retry(supabase.table("lessons").upsert({
        "id": lesson_id,
        "title": title,
        "description": desc,
        "module_id": module_id,
        "order_index": order_index
    }, on_conflict="id"))

    # 2. ЧИСТИМ СТАРЫЕ ДАННЫЕ (включая SRS)
    existing = db_execute_retry(supabase.table("lesson_items").select("id").eq("lesson_id", lesson_id))
    ids = [i['id'] for i in existing.data]
    if ids:
        for table in ["user_srs", "user_srs_items"]:
            try:
                db_execute_retry(supabase.table(table).delete().in_("item_id", ids))
            except:
                pass
        db_execute_retry(supabase.table("lesson_items").delete().eq("lesson_id", lesson_id))
        print(f"   🗑️  Cleaned {len(ids)} old items")

    # 3. ОБРАБАТЫВАЕМ КОНТЕНТ
    for idx, item in enumerate(content_list):
        # ═══════════════════════════════════════════════════════════════
        # УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК НОВЫХ ТИПОВ
        # ═══════════════════════════════════════════════════════════════
        new_types = ['theory', 'rule', 'reading-algorithm', 'intro', 'analysis', 'meet-teams', 'ready', 'title',
                     'learn_char', 'word_breakdown']
        if item['type'] in new_types:
            data = item.get('data', {}) or {}
            # Ищем кхмерский текст в разных полях
            khmer_text = data.get("khmer") or data.get("text") or data.get("word") or data.get("char") or ""
            audio_key = (data.get("audio") or "").strip()

            if audio_key and khmer_text:
                if not audio_key.startswith(SKIP_AUDIO_PREFIXES):
                    audio_key = ensure_mp3(audio_key)
                    data["audio"] = audio_key

                if not should_skip_generation(audio_key):
                    await generate_audio(str(khmer_text), audio_key)

            item["data"] = data

        # ═══════════════════════════════════════════════════════════════
        # QUIZ
        # ═══════════════════════════════════════════════════════════════
        elif item['type'] == 'quiz':
            options = item['data'].get('options', [])
            pron_map = item['data'].get('pronunciation_map', {})
            item['data']['options_metadata'] = {}

            for opt in options:
                clean_opt = opt.split(' (')[0].replace('?', '').strip()
                dict_res = db_execute_retry(
                    supabase.table("dictionary").select("pronunciation", "english").eq("khmer", clean_opt))
                entry = dict_res.data[0] if dict_res.data else {}

                eng = entry.get("english", "option")
                pron = pron_map.get(clean_opt, "") or entry.get("pronunciation", "")

                audio_name = get_safe_audio_name(clean_opt, eng, "option")
                await generate_audio(clean_opt, audio_name)

                item['data']['options_metadata'][opt] = {
                    "audio": audio_name,
                    "pronunciation": pron
                }

        # ═══════════════════════════════════════════════════════════════
        # VOCAB CARD
        # ═══════════════════════════════════════════════════════════════
        elif item['type'] == 'vocab_card':
            data = item.get('data', {})
            front = data.get('front', '') or ""
            back = data.get('back', '') or ""
            if back:
                clean_k = back.split(' (')[0].replace('?', '').strip()
                dict_res = db_execute_retry(
                    supabase.table("dictionary").select("pronunciation", "english").eq("khmer", clean_k))
                entry = dict_res.data[0] if dict_res.data else {}

                final_pron = data.get("pronunciation", "") or entry.get("pronunciation", "")
                english = entry.get("english", front)

                audio_name = get_safe_audio_name(clean_k, front, data.get('item_type', 'word'))
                await generate_audio(clean_k, audio_name)

                item['data']['audio'] = audio_name
                item['data']['pronunciation'] = final_pron

                db_execute_retry(supabase.table("dictionary").upsert({
                    "khmer": clean_k, "english": english, "pronunciation": final_pron,
                    "item_type": get_item_type(clean_k, english)
                }, on_conflict="khmer"))

        # ═══════════════════════════════════════════════════════════════
        # COMPARISON_AUDIO
        # ═══════════════════════════════════════════════════════════════
        elif item['type'] == 'comparison_audio':
            data = item.get('data', {}) or {}
            pairs = data.get('pairs', []) or []
            for p in pairs:
                for side in ["left", "right"]:
                    node = p.get(side, {})
                    txt = (node.get("text") or "").strip()
                    aud = (node.get("audio") or "").strip()
                    if aud:
                        if not aud.startswith(SKIP_AUDIO_PREFIXES):
                            aud = ensure_mp3(aud)
                            node["audio"] = aud
                        if txt and not should_skip_generation(aud):
                            await generate_audio(txt, aud)
            item["data"] = data

        # 4. ВСТАВЛЯЕМ ITEM В БД
        db_execute_retry(supabase.table("lesson_items").insert({
            "lesson_id": lesson_id,
            "type": item['type'],
            "order_index": idx,
            "data": item['data']
        }))


async def update_study_materials(module_id, lessons_data):
    """Обновляет саммари и Guidebook (Урок с ID = module_id)"""
    print(f"\n📚 Updating Summary & Guidebook for Module {module_id}...")
    summary_text = f"# Chapter Summary\n\n"
    aggregated_items = []
    seen_words = set()

    for lesson_id, info in sorted(lessons_data.items()):
        if "Final Quiz" in info.get('title', ''): continue
        summary_text += f"## {info.get('title', f'Lesson {lesson_id}')}\n"
        for item in info.get('content', []):
            if item['type'] == 'theory':
                summary_text += f"* 💡 **{item['data'].get('title', 'Note')}**: {item['data'].get('text', '')}\n"
                aggregated_items.append(item)
            if item['type'] == 'vocab_card':
                khmer, eng = item['data'].get('back', ''), item['data'].get('front', '')
                if khmer and eng:
                    summary_text += f"* **{khmer}** — {eng}\n"
                    if khmer not in seen_words:
                        seen_words.add(khmer)
                        aggregated_items.append(item)

    db_execute_retry(supabase.table("study_materials").upsert({
        "chapter_id": module_id, "title": f"Summary: Module {module_id}",
        "content": summary_text, "type": "summary"
    }, on_conflict="chapter_id"))

    # Очистка и перезаливка Guidebook (Lesson ID = module_id)
    db_execute_retry(supabase.table("lesson_items").delete().eq("lesson_id", module_id))
    for idx, item in enumerate(aggregated_items):
        db_execute_retry(supabase.table("lesson_items").insert({
            "lesson_id": module_id, "type": item['type'], "order_index": idx, "data": item['data']
        }))
    print(f"✅ Guidebook and Summary updated!")