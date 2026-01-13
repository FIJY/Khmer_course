import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path('.') / '.env')
url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

supabase: Client = create_client(url, key)


def list_tables():
    print("🔎 Ищем все доступные таблицы в схеме 'public'...")
    try:
        # SQL запрос для получения списка всех таблиц
        res = supabase.rpc('get_tables_info', {}).execute()
        # Если RPC не настроен, попробуем через системный запрос
        query = "select tablename from pg_catalog.pg_tables where schemaname = 'public'"
        # В некоторых версиях библиотеки можно просто через postgrest
        print("--- Список таблиц ---")
        # Мы просто попробуем обратиться к системному представлению через фильтр
        # Но проще всего посмотреть на ошибку, которую выдаст база при попытке
        # получить список из информационных таблиц
        tables = supabase.postgrest.rpc('get_all_tables').execute()  # если есть такая функция
    except:
        # Если функций нет, пойдем перебором самых вероятных имен,
        # чтобы точно найти, где спрятан справочник
        names = ["module_vocabulary", "chapter_guides", "module_content", "vocabulary_list", "study_notes"]
        for name in names:
            try:
                supabase.table(name).select("*").limit(1).execute()
                print(f"✅ НАЙДЕНА ТАБЛИЦА: {name}")
            except:
                pass


# Попробуем также глянуть, что внутри колонки vocabulary в таблице lessons
def check_vocab_column():
    print("\n🧐 Проверяем колонку 'vocabulary' в таблице 'lessons'...")
    try:
        res = supabase.table("lessons").select("id", "vocabulary").limit(3).execute()
        for row in res.data:
            print(f"   Урок {row['id']}: vocabulary = {row['vocabulary']}")
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")


list_tables()
check_vocab_column()