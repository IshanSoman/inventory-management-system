import sqlite3
import os

db_path = 'inventory.db'
if not os.path.exists(db_path):
    print(f"Database file {db_path} not found in current directory: {os.getcwd()}")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(customers);")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'telegram_chat_id' not in columns:
            print("Adding telegram_chat_id column to customers table...")
            cursor.execute("ALTER TABLE customers ADD COLUMN telegram_chat_id TEXT;")
            conn.commit()
            print("Successfully added telegram_chat_id column.")
        else:
            print("telegram_chat_id column already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Error updating database: {e}")
