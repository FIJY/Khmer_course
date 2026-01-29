# scripts/build_char_frequency.py
import json
import math
from pathlib import Path

INPUT = Path("C:\\Projects\\KhmerCourse\\content_engine\\frequency_list.txt")  # поправь путь под свой проект
OUTPUT = Path("src/data/frequencyByChar.json")


# Фильтруем: оставляем только кхмерский блок + coeng, чтобы не засорять
def is_khmer_char(ch: str) -> bool:
    cp = ord(ch)
    return (0x1780 <= cp <= 0x17FF) or ch == "្"


def main():
    if not INPUT.exists():
        raise FileNotFoundError(f"Not found: {INPUT}")

    scores = {}  # char -> raw score

    with INPUT.open("r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("RANK") or line.startswith("TOTAL"):
                continue

            parts = line.split("\t")
            if len(parts) < 3:
                continue

            token = parts[1]
            try:
                freq = float(parts[2])
            except:
                continue

            chars = [c for c in token if is_khmer_char(c)]
            if not chars:
                continue

            share = freq / len(chars)
            for c in chars:
                scores[c] = scores.get(c, 0.0) + share

    if not scores:
        raise RuntimeError("No Khmer chars found. Check input format.")

    max_score = max(scores.values())

    # Нормализация 0..1 с лог-сжатием (иначе топ-символы забьют всё)
    out = {}
    for ch, s in scores.items():
        intensity = math.log1p(s) / math.log1p(max_score)
        out[ch] = round(float(intensity), 6)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ Wrote {OUTPUT} ({len(out)} chars)")
    print(f"max raw score = {max_score}")


if __name__ == "__main__":
    main()
