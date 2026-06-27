import MySQLdb
import os
import sys

schema_path = os.path.join("database", "schema.sql")
seeds_path = os.path.join("database", "seeds.sql")

def run_sql_file(cursor, filepath):
    print("Running SQL file:", filepath)
    if not os.path.exists(filepath):
        print(f"Error: SQL file {filepath} not found.")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Strip comments line by line
    lines = content.splitlines()
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped.startswith('--') and not stripped.startswith('#'):
            cleaned_lines.append(line)
            
    clean_content = "\n".join(cleaned_lines)
    queries = clean_content.split(';')
    for query in queries:
        query = query.strip()
        if not query:
            continue
        try:
            cursor.execute(query)
        except Exception as e:
            print("Error executing query segment:", query[:60].replace('\n', ' '), "...", e)

try:
    print("Connecting to local MySQL instance on port 3307...")
    db = MySQLdb.connect(host="127.0.0.1", port=3307, user="root", passwd="")
    cursor = db.cursor()
    
    # Check if database exists and has tables to avoid wiping user data
    cursor.execute("SHOW DATABASES LIKE 'smartspend'")
    db_exists = cursor.fetchone()
    
    if db_exists:
        cursor.execute("USE smartspend")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        if len(tables) > 0:
            print("Database 'smartspend' and tables already exist. Skipping drop/seed to preserve user data.")
            db.close()
            sys.exit(0)
            
    print("Resetting database 'smartspend'...")
    cursor.execute("DROP DATABASE IF EXISTS smartspend;")
    cursor.execute("CREATE DATABASE smartspend;")
    
    run_sql_file(cursor, schema_path)
    run_sql_file(cursor, seeds_path)
    
    db.commit()
    print("Database migration and seeding completed successfully!")
    db.close()
except Exception as e:
    print("Failed to configure database:", e)
    sys.exit(1)
