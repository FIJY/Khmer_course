import asyncio
import os
import json
import edge_tts

OUTPUT_DIR = "assets/audio/alphabet"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# База данных букв (Пример для "Домиков")
alphabet_data = [
    # Буква, Имя, Тип, Ряд, Группа, Звук1, Звук2
    ("ក", "Ko", "consonant", 1, "House", "kɑː", "kɔː"),
    ("ខ", "Kho", "consonant", 1, "House", "kʰɑː", "kʰɔː"),
    ("គ", "Ko (Series 2)", "consonant", 2, "House", "kɔː", "kɔː"),
    ("ឃ", "Kho (Series 2)", "consonant", 2, "House", "kʰɔː", "kʰɔː"),
    # ... сюда добавим остальные позже
]


async def generate_alphabet_assets():
    results = []
    print("🏗 Генерация алфавита...")

    for char, name, type_, series, group, s1, s2 in alphabet_data:
        # Генерация аудио
        filename = f"{name.replace(' ', '_')}.mp3"
        filepath = os.path.join(OUTPUT_DIR, filename)

        # Используем мужской голос для букв (он четче)
        comm = edge_tts.Communicate(char, "km-KH-PisethNeural")
        await comm.save(filepath)

        results.append({
            "id": char,
            "name_en": name,
            "type": type_,
            "series": series,
            "shape_group": group,
            "sound_series_1": s1,
            "sound_series_2": s2,
            "audio_url": f"/audio/alphabet/{filename}"
        })
        print(f"✅ {char} ({name}) ready")

    with open("alphabet_batch.json", "w", encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    asyncio.run(generate_alphabet_assets())