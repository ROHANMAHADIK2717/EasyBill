const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class Database {
    constructor() {
        // Create data directory if it doesn't exist
        const userDataPath = app ? app.getPath('userData') : './data';
        const dataDir = path.join(userDataPath, 'billing-data');

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const dbPath = path.join(dataDir, 'billing.db');
        this.db = new sqlite3.Database(dbPath);
        this.initializeTables();
    }

    initializeTables() {
        // Business settings table
        this.db.run(`
      CREATE TABLE IF NOT EXISTS business_settings (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        tax_number TEXT,
        currency TEXT DEFAULT 'USD',
        tax_rate REAL DEFAULT 0,
        business_type TEXT DEFAULT 'general',
        logo_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Categories table
        this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Products/Items table
        this.db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        price REAL NOT NULL,
        cost_price REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        sku TEXT UNIQUE,
        barcode TEXT,
        unit TEXT DEFAULT 'pcs',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

        // Customers table
        this.db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        customer_type TEXT DEFAULT 'regular',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Bills/Invoices table
        this.db.run(`
      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        customer_name TEXT,
        subtotal REAL NOT NULL,
        tax_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        payment_status TEXT DEFAULT 'paid',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )
    `);

        // Bill items table
        this.db.run(`
      CREATE TABLE IF NOT EXISTS bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

        // Insert default business settings if none exist
        this.db.get("SELECT COUNT(*) as count FROM business_settings", (err, row) => {
            if (err) {
                console.error('Error checking business settings:', err);
                return;
            }

            if (row.count === 0) {
                this.db.run(`
          INSERT INTO business_settings (name, business_type, currency, tax_rate)
          VALUES ('My Business', 'general', 'USD', 0)
        `);
            }
        });

        // Insert default categories
        const defaultCategories = ['General', 'Food & Beverages', 'Clothing', 'Electronics', 'Services'];
        defaultCategories.forEach(category => {
            this.db.run(`
        INSERT OR IGNORE INTO categories (name)
        VALUES (?)
      `, [category]);
        });
    }

    // Generic query methods
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = Database;