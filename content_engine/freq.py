from collections import defaultdict

# Путь к файлу - замените на свой
file_path = "frequency_list.txt"  # УКАЖИТЕ ЗДЕСЬ ПУТЬ К ВАШЕМУ ФАЙЛУ

# Словарь для подсчета взвешенной частоты букв
letter_weighted_freq = defaultdict(float)
total_weight = 0

# Читаем файл и обрабатываем
with open(file_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == 0:  # Пропускаем заголовок
            continue

        parts = line.strip().split('\t')
        if len(parts) < 3:
            continue

        token = parts[1]  # Слово
        frequency = float(parts[2])  # Коэффициент частоты

        # Для каждой буквы в слове добавляем взвешенную частоту
        for char in token:
            if '\u1780' <= char <= '\u17FF':  # Кхмерские символы
                letter_weighted_freq[char] += frequency
                total_weight += frequency

# Сортируем по взвешенной частоте
sorted_freq = sorted(letter_weighted_freq.items(), key=lambda x: x[1], reverse=True)

# Выводим результаты
print(f"Взвешенная частота кхмерских букв (с учетом частоты слов)")
print(f"Всего взвешенных символов: {total_weight:.6f}\n")
print(f"{'Ранг':<6} {'Буква':<8} {'Взв. частота':<15} {'Процент':<10} {'Накопит. %'}")
print("=" * 70)

cumulative = 0
for rank, (letter, weight) in enumerate(sorted_freq, 1):
    percent = (weight / total_weight) * 100
    cumulative += percent
    print(f"{rank:<6} {letter:<8} {weight:<15.10f} {percent:>6.2f}%    {cumulative:>6.2f}%")

# Статистика
print("\n" + "=" * 70)
print(f"Всего уникальных букв: {len(letter_weighted_freq)}")

top10_weight = sum([weight for _, weight in sorted_freq[:10]])
top20_weight = sum([weight for _, weight in sorted_freq[:20]])
print(f"Топ-10 букв покрывают: {(top10_weight / total_weight) * 100:.2f}% текста")
print(f"Топ-20 букв покрывают: {(top20_weight / total_weight) * 100:.2f}% текста")

# Дополнительная статистика по типам символов
consonants = []
vowels = []
diacritics = []

for letter, weight in sorted_freq:
    code = ord(letter)
    if 0x1780 <= code <= 0x17A2:  # Согласные
        consonants.append((letter, weight))
    elif 0x17A3 <= code <= 0x17B3:  # Независимые гласные
        vowels.append((letter, weight))
    else:  # Диакритики и зависимые гласные
        diacritics.append((letter, weight))

print(f"\nСогласных: {len(consonants)}")
print(f"Независимых гласных: {len(vowels)}")
print(f"Диакритических знаков: {len(diacritics)}")

# Топ-10 согласных
print("\nТоп-10 согласных:")
for i, (letter, weight) in enumerate(consonants[:10], 1):
    percent = (weight / total_weight) * 100
    print(f"{i}. {letter} - {percent:.2f}%")