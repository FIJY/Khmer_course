import os

# Какие папки игнорировать
IGNORE_DIRS = {'node_modules', '.git', '.next', 'dist', 'build', '__pycache__'}
# Какие расширения искать
EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.html'}

output_file = "FULL_PROJECT_CONTEXT.txt"

with open(output_file, 'w', encoding='utf-8') as outfile:
    for root, dirs, files in os.walk("."):
        # Исключаем ненужные папки
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            if any(file.endswith(ext) for ext in EXTENSIONS):
                # Исключаем package-lock.json (слишком большой)
                if file == 'package-lock.json':
                    continue

                path = os.path.join(root, file)
                outfile.write(f"\n\n{'=' * 20}\nFILE: {path}\n{'=' * 20}\n\n")
                try:
                    with open(path, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"Error reading file: {e}")

print(f"Готово! Файл {output_file} создан. Кидай его в чат.")
