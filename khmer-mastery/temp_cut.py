from pydub import AudioSegment
from pydub.silence import detect_leading_silence
import os


def trim_silence(audio_path, output_path=None, silence_thresh=-50):
    """
    Обрезает тишину в начале и конце

    silence_thresh: порог тишины в dB (-50 = стандарт, -40 = агрессивнее)
    """
    audio = AudioSegment.from_file(audio_path)

    # Обрезаем начало
    start_trim = detect_leading_silence(audio, silence_threshold=silence_thresh)

    # Обрезаем конец (переворачиваем аудио)
    end_trim = detect_leading_silence(audio.reverse(), silence_threshold=silence_thresh)

    # Применяем обрезку
    trimmed = audio[start_trim:len(audio) - end_trim]

    # Сохраняем
    if output_path is None:
        output_path = audio_path  # перезаписываем оригинал

    trimmed.export(output_path, format="mp3")

    print(f"✂️  {os.path.basename(audio_path)}: удалено {start_trim}мс в начале, {end_trim}мс в конце")
    return trimmed


# Исправленные пути
audio_dir = 'public/sounds'

# Сначала проверим один файл
test_file = os.path.join(audio_dir, 'ka.mp3')
if os.path.exists(test_file):
    print(f"Тестируем файл: {test_file}")
    trim_silence(test_file, silence_thresh=-50)
else:
    print(f"❌ Файл не найден: {test_file}")
    print(f"Проверяем содержимое папки {audio_dir}:")
    if os.path.exists(audio_dir):
        files = [f for f in os.listdir(audio_dir) if f.endswith('.mp3')]
        print(f"Найдено {len(files)} MP3 файлов:")
        for f in files[:10]:  # показываем первые 10
            print(f"  - {f}")
    else:
        print(f"❌ Папка {audio_dir} не существует!")

# Если тестовый файл OK → обрабатываем все
print("\n" + "=" * 50)
print("Обработка всех файлов...")
print("=" * 50 + "\n")

for filename in sorted(os.listdir(audio_dir)):
    if filename.endswith('.mp3'):
        filepath = os.path.join(audio_dir, filename)
        try:
            trim_silence(filepath, silence_thresh=-50)
        except Exception as e:
            print(f"❌ Ошибка в {filename}: {e}")

print("\n✅ Готово!")