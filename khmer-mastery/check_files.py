import os

print("🔍 ИЩЕМ ФАЙЛЫ...")
print("-" * 30)

# Папка, где ищем
start_dir = os.path.join("src", "components")

found_hero = False
found_text = False

for root, dirs, files in os.walk(start_dir):
    for file in files:
        if file in ["HeroSlide.jsx", "KhmerColoredText.jsx", "InventorySlide.jsx"]:
            # Получаем полный путь
            full_path = os.path.join(root, file)
            # Упрощаем путь для чтения
            rel_path = os.path.relpath(full_path, os.getcwd())
            print(f"✅ НАЙДЕН: {file}")
            print(f"   ПУТЬ:   {rel_path}")
            print("-" * 30)

print("Готово.")
