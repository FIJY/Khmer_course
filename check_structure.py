import os


def print_structure(start_path):
    # Папки, которые мы НЕ хотим видеть в отчете (мусор)
    IGNORE_DIRS = {
        'node_modules', 'venv', '.git', '.idea', '__pycache__',
        'dist', '.vscode', 'build'
    }

    print(f"📂 PROJECT ROOT: {os.path.basename(os.path.abspath(start_path))}")
    print("=" * 40)

    for root, dirs, files in os.walk(start_path):
        # Фильтруем папки (удаляем ненужные из обхода)
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        level = root.replace(start_path, '').count(os.sep)
        indent = '│   ' * level

        # Печатаем название папки (если это не корень)
        if level > 0:
            print(f"{indent}├── 📁 {os.path.basename(root)}/")

        subindent = '│   ' * (level + 1)

        # Печатаем файлы
        for f in files:
            # Игнорируем сам этот скрипт и скрытые файлы
            if f == 'check_structure.py' or f.startswith('.'):
                continue
            print(f"{subindent}├── {f}")


if __name__ == "__main__":
    # Запускаем проверку текущей папки
    current_folder = os.getcwd()
    print_structure(current_folder)
