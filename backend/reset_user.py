import sqlite3
import bcrypt

DB_PATH = "visioncare.db"
EMAIL = "nurse@visioncare.com"
PASSWORD = "password123"
NAME = "Default Nurse"
ROLE = "nurse"
WARD_ID = "ICU-1"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Check table name (might be 'users' or 'user')
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cur.fetchall()]
print("Tables found:", tables)

table = "users" if "users" in tables else "user"

hashed_pw = bcrypt.hashpw(PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

cur.execute(f"SELECT COUNT(*) FROM {table}")
count = cur.fetchone()[0]
print(f"Existing users: {count}")

if count > 0:
    cur.execute(
        f"UPDATE {table} SET hashed_password=?, email=? WHERE rowid=1",
        (hashed_pw, EMAIL)
    )
    print(f"Password reset for first user -> {EMAIL} / {PASSWORD}")
else:
    cur.execute(
        f"INSERT INTO {table} (email, name, hashed_password, role, ward_id) VALUES (?,?,?,?,?)",
        (EMAIL, NAME, hashed_pw, ROLE, WARD_ID)
    )
    print(f"Created new user: {EMAIL} / {PASSWORD}")

conn.commit()
conn.close()
print("Done! You can now login with:")
print(f"  Email:    {EMAIL}")
print(f"  Password: {PASSWORD}")
