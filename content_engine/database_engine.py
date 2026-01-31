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
    # если уже есть расширение — оставляем как есть
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
    """
    Генерирует безопасное имя аудиофайла на основе кхмерского текста и типа.
    Примеры:
    - get_safe_audio_name("សួស្តី", "Hello", "phrase") → "hello_a1b2c3.mp3"
    """
    clean_k = khmer_text.split(' (')[0].replace('?', '').strip()

    base_label = english_label or item_type
    safe_label = re.sub(r'[\\/*?:"<>|]', "", base_label).lower().strip().replace(' ', '_')[:16]

    w_hash = hashlib.md5(clean_k.encode()).hexdigest()[:6]

    return f"{safe_label}_{w_hash}.mp3"


def get_item_type(khmer_text, english_text):
    """Определяет тип элемента"""
    clean = khmer_text.split(' (')[0].strip()
    if '?' in clean or clean.count(' ') >= 2:
        return 'sentence'
    if any(char.isdigit() for char in (english_text or "")):
        return 'number'
    if clean in ["ដែល", "សូត្របាទ", "ពិបាក", "សុខ"]:
        return 'phrase'
    return 'word'


async def generate_audio(text, filename):
    """Генерирует аудиофайл с помощью TTS"""
    filename = ensure_mp3(filename)
    filepath = AUDIO_DIR / filename

    if filepath.exists():
        print(f"   ⏭️  Already exists: {filename}")
        return

    clean_text = text.split(' (')[0].replace('?', '').strip()
    if not clean_text:
        print(f"   ⚠️  Empty text for {filename}, skipping")
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
    print(f"   ✅ Lesson metadata inserted")

    # 2. ЧИСТИМ СТАРЫЕ ДАННЫЕ
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
        print(f"\n   📝 Item {idx + 1}/{len(content_list)}: {item['type']}")

        # ═══════════════════════════════════════════════════════════════
        # A) QUIZ
        # ═══════════════════════════════════════════════════════════════
        if item['type'] == 'quiz':
            options = item['data'].get('options', [])
            pron_map = item['data'].get('pronunciation_map', {})
            item['data']['options_metadata'] = {}

            for opt in options:
                clean_opt = opt.split(' (')[0].replace('?', '').strip()

                dict_res = db_execute_retry(
                    supabase.table("dictionary").select("pronunciation", "english").eq("khmer", clean_opt)
                )
                entry = dict_res.data[0] if dict_res.data else {}

                db_pron = entry.get("pronunciation", "")
                eng = entry.get("english", "option")
                json_pron = pron_map.get(clean_opt, "")

                if json_pron:
                    pron = json_pron
                    if pron != db_pron:
                        try:
                            db_execute_retry(supabase.table("dictionary").upsert({
                                "khmer": clean_opt,
                                "pronunciation": pron,
                                "english": eng if eng != "option" else "Quiz Option",
                                "item_type": "word"
                            }, on_conflict="khmer"))
                        except:
                            pass
                else:
                    pron = db_pron

                audio_name = get_safe_audio_name(clean_opt, eng, "option")
                await generate_audio(clean_opt, audio_name)

                item['data']['options_metadata'][opt] = {
                    "audio": audio_name,
                    "pronunciation": pron
                }

        # ═══════════════════════════════════════════════════════════════
        # B) VOCAB CARD (главный источник аудио словаря)
        # ═══════════════════════════════════════════════════════════════
        if item['type'] == 'vocab_card':
            data = item.get('data', {})
            front = data.get('front', '') or ""  # Английский
            back = data.get('back', '') or ""  # Кхмерский
            item_type = data.get('item_type', 'word')

            if back:
                clean_k = back.split(' (')[0].replace('?', '').strip()

                dict_res = db_execute_retry(
                    supabase.table("dictionary").select("pronunciation", "english").eq("khmer", clean_k)
                )
                entry = dict_res.data[0] if dict_res.data else {}

                json_pron = data.get("pronunciation", "")
                final_pron = json_pron or entry.get("pronunciation", "")

                english = entry.get("english", front)

                audio_name = get_safe_audio_name(clean_k, front, item_type)
                await generate_audio(clean_k, audio_name)

                item['data']['audio'] = audio_name
                item['data']['pronunciation'] = final_pron

                db_execute_retry(supabase.table("dictionary").upsert({
                    "khmer": clean_k,
                    "english": english,
                    "pronunciation": final_pron,
                    "item_type": get_item_type(clean_k, english)
                }, on_conflict="khmer"))

        # ═══════════════════════════════════════════════════════════════
        # C) LEARN_CHAR (буквы) — ❗ НЕ ГЕНЕРИМ (используем готовые letter_*.mp3)
        # ═══════════════════════════════════════════════════════════════
        if item['type'] == 'learn_char':
            data = item.get('data', {})
            # Если в JSON уже есть data.audio = "letter_ka" — оставляем как есть.
            # Если аудио нет — тоже не генерим (иначе разведём хаос имен).
            if 'audio' in data:
                data['audio'] = ensure_mp3(data['audio']) if data['audio'].endswith(".mp3") else data['audio']
                item['data'] = data

        # ═══════════════════════════════════════════════════════════════
        # D) WORD_BREAKDOWN (разбор слова)
        # ═══════════════════════════════════════════════════════════════
        if item['type'] == 'word_breakdown':
            data = item.get('data', {})
            word_text = data.get('word', '')

            if word_text:
                word_trans = data.get('translation', 'word')
                audio_name = get_safe_audio_name(word_text, word_trans, 'word')
                await generate_audio(word_text, audio_name)
                item['data']['audio'] = audio_name

        # ═══════════════════════════════════════════════════════════════
        # E) VISUAL_DECODER
        # ═══════════════════════════════════════════════════════════════
        if item['type'] == 'visual_decoder':
            data = item.get('data', {})
            word = data.get('word', '')
            english_trans = data.get('english_translation', 'word')

            if word:
                audio_name = get_safe_audio_name(word, english_trans, 'decoder')
                await generate_audio(word, audio_name)
                item['data']['word_audio'] = audio_name

        # ═══════════════════════════════════════════════════════════════
        # F) COMPARISON_AUDIO — ✅ генерим слоги/слова по парам
        # ═══════════════════════════════════════════════════════════════
        if item['type'] == 'comparison_audio':
            data = item.get('data', {}) or {}
            pairs = data.get('pairs', []) or []

            for p in pairs:
                left = (p.get("left") or {})
                right = (p.get("right") or {})

                # LEFT
                l_text = (left.get("text") or "").strip()
                l_audio_key = (left.get("audio") or "").strip()
                if l_audio_key:
                    # нормализуем в JSON: добавляем .mp3 для файловых ключей (кроме letter_*)
                    if not l_audio_key.startswith(SKIP_AUDIO_PREFIXES):
                        l_audio_key = ensure_mp3(l_audio_key)
                        left["audio"] = l_audio_key

                    if l_text and (not should_skip_generation(left.get("audio") or "")):
                        await generate_audio(l_text, left["audio"])

                # RIGHT
                r_text = (right.get("text") or "").strip()
                r_audio_key = (right.get("audio") or "").strip()
                if r_audio_key:
                    if not r_audio_key.startswith(SKIP_AUDIO_PREFIXES):
                        r_audio_key = ensure_mp3(r_audio_key)
                        right["audio"] = r_audio_key

                    if r_text and (not should_skip_generation(right.get("audio") or "")):
                        await generate_audio(r_text, right["audio"])

                p["left"] = left
                p["right"] = right

            data["pairs"] = pairs
            item["data"] = data

        # ═══════════════════════════════════════════════════════════════
        # G) ANALYSIS — ✅ если есть data.audio + khmer/text → генерим
        # ═══════════════════════════════════════════════════════════════
        if item['type'] == 'analysis':
            data = item.get('data', {}) or {}

            # текст для TTS: берём khmer/word/khmerText, иначе не генерим
            khmer_text = data.get("khmer") or data.get("word") or data.get("khmerText") or ""
            if not khmer_text and isinstance(data.get("text"), str) and KHMER_PATTERN.search(data.get("text", "")):
                khmer_text = data.get("text", "")

            audio_key = (data.get("audio") or "").strip()
            if audio_key:
                if not audio_key.startswith(SKIP_AUDIO_PREFIXES):
                    audio_key = ensure_mp3(audio_key)
                    data["audio"] = audio_key

                if khmer_text and (not should_skip_generation(data.get("audio") or "")):
                    await generate_audio(str(khmer_text), data["audio"])

            item["data"] = data

        # ═══════════════════════════════════════════════════════════════
        # H) DRILL_CHOICE — ✅ генерим аудио опций, если это НЕ letter_*
        # ═══════════════════════════════════════════════════════════════
        if item['type'] == 'drill_choice':
            data = item.get('data', {}) or {}
            options = data.get('options', []) or []

            for opt in options:
                o_text = (opt.get("text") or opt.get("char") or "").strip()
                o_audio = (opt.get("audio") or "").strip()

                if not o_audio:
                    continue

                # нормализуем только если это не letter_*
                if not o_audio.startswith(SKIP_AUDIO_PREFIXES):
                    o_audio = ensure_mp3(o_audio)
                    opt["audio"] = o_audio

                # генерим только не-letter
                if o_text and (not should_skip_generation(opt.get("audio") or "")):
                    await generate_audio(o_text, opt["audio"])

            data["options"] = options
            item["data"] = data

        # 4. ВСТАВЛЯЕМ ITEM В БД
        db_execute_retry(supabase.table("lesson_items").insert({
            "lesson_id": lesson_id,
            "type": item['type'],
            "order_index": idx,
            "data": item['data']
        }))

    # 5. ОБНОВЛЯЕМ LESSON JSON (fallback совместимость)
    try:
        db_execute_retry(supabase.table("lessons").update({
            "content": content_list
        }).eq("id", lesson_id))
        print(f"\n   ✅ Updated lesson content JSON with audio references")
    except Exception as e:
        print(f"   ⚠️ Could not update lesson content JSON: {e}")

    print(f"\n🎉 Lesson {lesson_id} synced with {len(content_list)} items!")


async def update_study_materials(module_id, lessons_data):
    """
    1. Обновляет текстовое саммари.
    2. Переиспользует Урок-Главку (ID = module_id) чтобы кнопка 'Книжечка'
       показывала ВСЕ слова главы.
    """
    print(f"\n📚 Updating Summary & Guidebook for Module {module_id}...")

    summary_text = f"# Chapter Summary\n\n"

    aggregated_items = []
    seen_words = set()

    sorted_lessons = sorted(lessons_data.items(), key=lambda x: x[0])

    for lesson_id, info in sorted_lessons:
        if "Final Quiz" in info.get('title', ''):
            continue

        lesson_title = info.get('title', f'Lesson {lesson_id}')
        summary_text += f"## {lesson_title}\n"

        for item in info.get('content', []):
            if item['type'] == 'theory':
                t_title = item['data'].get('title', 'Note')
                t_text = item['data'].get('text', '')
                summary_text += f"* 💡 **{t_title}**: {t_text}\n"
                aggregated_items.append(item)

        summary_text += "\n"

        for item in info.get('content', []):
            if item['type'] == 'vocab_card':
                data = item.get('data', {})
                khmer = data.get('back', '')
                eng = data.get('front', '')
                pron = data.get('pronunciation', '')

                if khmer and eng:
                    summary_text += f"* **{khmer}** ({pron}) — {eng}\n"

                if khmer and khmer not in seen_words:
                    seen_words.add(khmer)
                    aggregated_items.append(item)

        summary_text += "\n"

    try:
        db_execute_retry(supabase.table("study_materials").upsert({
            "chapter_id": module_id,
            "title": f"Summary: Module {module_id}",
            "content": summary_text,
            "type": "summary"
        }, on_conflict="chapter_id"))
        print(f"✅ Text summary updated!")
    except Exception as e:
        print(f"⚠️ Failed to update study_materials: {e}")

    print(f"📖 Regenerating Chapter Guidebook (Lesson ID {module_id})...")

    existing = db_execute_retry(supabase.table("lesson_items").select("id").eq("lesson_id", module_id))
    ids = [i['id'] for i in existing.data]
    if ids:
        db_execute_retry(supabase.table("lesson_items").delete().eq("lesson_id", module_id))
        print(f"   🗑️  Cleaned {len(ids)} old guidebook items")

    for idx, item in enumerate(aggregated_items):
        db_execute_retry(supabase.table("lesson_items").insert({
            "lesson_id": module_id,
            "type": item['type'],
            "order_index": idx,
            "data": item['data']
        }))

    print(f"✅ Guidebook (Lesson {module_id}) filled with {len(aggregated_items)} items!")
