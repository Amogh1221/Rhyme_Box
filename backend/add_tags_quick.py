import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT ''")
    conn.commit()
    print("✅ Column 'tags' added successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    cursor.close()
    conn.close()
