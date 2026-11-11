import os
import sqlite3
from datetime import datetime, timedelta
import random
from pathlib import Path
from werkzeug.security import generate_password_hash
from backend.config import config

def get_db_path():
    path = Path(config.DATABASE_PATH)
    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path)

def get_db():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initializes SQLite database tables and indexes."""
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            monthly_income REAL DEFAULT 3200.0,
            currency TEXT DEFAULT 'USD',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Categories Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            icon TEXT NOT NULL,
            color TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('expense', 'income'))
        )
    """)

    # 3. Budgets Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            monthly_limit REAL NOT NULL,
            month_year TEXT NOT NULL, -- e.g. '2026-11'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
            UNIQUE(user_id, category_id, month_year)
        )
    """)

    # 4. Transactions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL, -- YYYY-MM-DD
            description TEXT NOT NULL,
            payment_method TEXT DEFAULT 'card', -- 'card', 'cash', 'paypal', 'bank_transfer'
            type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )
    """)

    # 5. PayPal Transactions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS paypal_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            order_id TEXT UNIQUE NOT NULL,
            capture_id TEXT,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            status TEXT NOT NULL, -- 'CREATED', 'COMPLETED', 'FAILED', 'CANCELLED'
            purchase_item TEXT NOT NULL,
            category_id INTEGER,
            transaction_id INTEGER,
            payload_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
    """)

    # 6. AI Conversation History Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL, -- 'user', 'assistant'
            message TEXT NOT NULL,
            intent TEXT, -- 'general', 'advice', 'budget_recommendation', 'spending_query'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Create helpful indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_user_date ON transactions(user_id, date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_user_cat ON transactions(user_id, category_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month_year)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_paypal_order ON paypal_transactions(order_id)")

    conn.commit()
    conn.close()

def seed_demo_data():
    """Seeds baseline categories and demo user transactions if database is fresh."""
    conn = get_db()
    cursor = conn.cursor()

    # Check if categories exist
    cursor.execute("SELECT COUNT(*) as count FROM categories")
    if cursor.fetchone()["count"] == 0:
        categories = [
            ("Food & Dining", "Utensils", "#10b981", "expense"),
            ("Rent & Housing", "Home", "#3b82f6", "expense"),
            ("Transportation", "Car", "#f59e0b", "expense"),
            ("Entertainment", "Film", "#8b5cf6", "expense"),
            ("Shopping & Tech", "ShoppingBag", "#ec4899", "expense"),
            ("Healthcare", "HeartPulse", "#ef4444", "expense"),
            ("Education & Career", "BookOpen", "#6366f1", "expense"),
            ("Subscriptions", "CreditCard", "#06b6d4", "expense"),
            ("Miscellaneous", "Tag", "#64748b", "expense"),
            ("Salary & Income", "TrendingUp", "#16a34a", "income"),
            ("Freelance & Side Gig", "Briefcase", "#22c55e", "income"),
        ]
        cursor.executemany(
            "INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)",
            categories
        )
        conn.commit()

    # Check if demo user exists
    cursor.execute("SELECT id FROM users WHERE username = 'alex_student'")
    demo_user = cursor.fetchone()

    if not demo_user:
        hashed_pw = generate_password_hash("Password123!")
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, monthly_income, currency)
            VALUES (?, ?, ?, ?, ?)
        """, ("alex_student", "alex@example.com", hashed_pw, 3200.0, "USD"))
        user_id = cursor.lastrowid
        conn.commit()

        # Seed Budgets for current month (e.g. 2026-11)
        now = datetime.now()
        current_month = now.strftime("%Y-%m")
        prev_month = (now.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")

        cursor.execute("SELECT id, name FROM categories WHERE type = 'expense'")
        cat_map = {row["name"]: row["id"] for row in cursor.fetchall()}

        budget_rules = {
            "Food & Dining": 550.0,
            "Rent & Housing": 950.0,
            "Transportation": 180.0,
            "Entertainment": 150.0,
            "Shopping & Tech": 220.0,
            "Healthcare": 80.0,
            "Education & Career": 120.0,
            "Subscriptions": 65.0,
            "Miscellaneous": 100.0,
        }

        for m in [prev_month, current_month]:
            for cat_name, limit in budget_rules.items():
                if cat_name in cat_map:
                    cursor.execute("""
                        INSERT OR IGNORE INTO budgets (user_id, category_id, monthly_limit, month_year)
                        VALUES (?, ?, ?, ?)
                    """, (user_id, cat_map[cat_name], limit, m))
        conn.commit()

        # Seed Realistic Sample Transactions
        cursor.execute("SELECT id, name FROM categories")
        all_cats = {row["name"]: row["id"] for row in cursor.fetchall()}

        # Regular income
        for offset_month in [1, 0]:
            month_date = (now - timedelta(days=offset_month * 30)).strftime("%Y-%m")
            cursor.execute("""
                INSERT INTO transactions (user_id, category_id, amount, date, description, payment_method, type, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, all_cats["Salary & Income"], 2800.0, f"{month_date}-01", "Graduate Research Assistant Stipend", "bank_transfer", "income", "Bi-monthly direct deposit"))

            cursor.execute("""
                INSERT INTO transactions (user_id, category_id, amount, date, description, payment_method, type, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, all_cats["Freelance & Side Gig"], 400.0, f"{month_date}-15", "Web Development Freelance Project", "paypal", "income", "Client project milestone"))

        # Past 60 days realistic expenses
        sample_expenses = [
            ("Trader Joe's Grocery Haul", 78.45, "Food & Dining", 2, "card"),
            ("Campus Cafe & Matcha Latte", 8.50, "Food & Dining", 3, "card"),
            ("Apartment Monthly Rent Share", 850.00, "Rent & Housing", 10, "bank_transfer"),
            ("High-speed Fiber Internet", 45.00, "Rent & Housing", 8, "card"),
            ("Subway Monthly Pass", 90.00, "Transportation", 11, "card"),
            ("Uber to Airport", 34.20, "Transportation", 14, "paypal"),
            ("Chipotle Mexican Grill", 16.80, "Food & Dining", 5, "card"),
            ("Spotify Premium Student", 5.99, "Subscriptions", 6, "paypal"),
            ("GitHub Copilot Subscription", 10.00, "Subscriptions", 7, "paypal"),
            ("Netflix Standard Share", 11.99, "Subscriptions", 9, "card"),
            ("Movie Night - Dune Part 2 IMAX", 22.50, "Entertainment", 12, "card"),
            ("Steam Indie Games Bundle", 29.99, "Entertainment", 16, "paypal"),
            ("Anker USB-C Power Bank", 39.99, "Shopping & Tech", 18, "paypal"),
            ("Whole Foods Weekly Produce", 64.20, "Food & Dining", 19, "card"),
            ("Gym Membership Fee", 45.00, "Healthcare", 21, "card"),
            ("CVS Pharmacy Health Supplies", 24.50, "Healthcare", 23, "card"),
            ("Used Machine Learning Textbook", 48.00, "Education & Career", 25, "card"),
            ("Target Room Organization & Decor", 42.15, "Shopping & Tech", 27, "card"),
            ("Electric Utility Bill", 55.40, "Rent & Housing", 28, "bank_transfer"),
            ("Thai Takeout Dinner", 28.50, "Food & Dining", 1, "card"),
            ("Blue Bottle Coffee & Croissant", 9.25, "Food & Dining", 0, "card"),
            ("Ergonomic Vertical Mouse", 29.99, "Shopping & Tech", 4, "paypal"),
        ]

        for desc, amt, cat_name, days_ago, pay_method in sample_expenses:
            tx_date = (now - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            cat_id = all_cats.get(cat_name, all_cats["Miscellaneous"])
            cursor.execute("""
                INSERT INTO transactions (user_id, category_id, amount, date, description, payment_method, type, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, cat_id, amt, tx_date, desc, pay_method, "expense", "Sample student transaction"))

        # Seed a sample completed PayPal Sandbox transaction
        cursor.execute("""
            INSERT INTO paypal_transactions (user_id, order_id, capture_id, amount, currency, status, purchase_item, category_id, payload_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            "SANDBOX-ORDER-DEMO-98213",
            "SANDBOX-CAPTURE-DEMO-98213",
            39.99,
            "USD",
            "COMPLETED",
            "Anker USB-C Power Bank",
            all_cats["Shopping & Tech"],
            '{"status": "COMPLETED", "note": "Pre-seeded verified sandbox payment demo"}'
        ))

        conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_demo_data()
    print("Database initialized and seeded successfully!")
