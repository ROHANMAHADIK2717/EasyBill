const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

module.exports = (app, db) => {

    // Business Settings Routes
    app.get('/api/business-settings', async (req, res) => {
        try {
            const settings = await db.get('SELECT * FROM business_settings ORDER BY id LIMIT 1');
            res.json(settings || {});
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/business-settings', async (req, res) => {
        try {
            const { name, address, phone, email, tax_number, currency, tax_rate, business_type } = req.body;

            const existing = await db.get('SELECT id FROM business_settings LIMIT 1');

            if (existing) {
                await db.run(`
          UPDATE business_settings 
          SET name = ?, address = ?, phone = ?, email = ?, tax_number = ?, 
              currency = ?, tax_rate = ?, business_type = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [name, address, phone, email, tax_number, currency, tax_rate, business_type, existing.id]);
            } else {
                await db.run(`
          INSERT INTO business_settings 
          (name, address, phone, email, tax_number, currency, tax_rate, business_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, address, phone, email, tax_number, currency, tax_rate, business_type]);
            }

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Categories Routes
    app.get('/api/categories', async (req, res) => {
        try {
            const categories = await db.all('SELECT * FROM categories ORDER BY name');
            res.json(categories);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/categories', async (req, res) => {
        try {
            const { name, description } = req.body;
            const result = await db.run(
                'INSERT INTO categories (name, description) VALUES (?, ?)',
                [name, description]
            );
            res.json({ id: result.id, success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Products Routes
    app.get('/api/products', async (req, res) => {
        try {
            const products = await db.all(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = 1
        ORDER BY p.name
      `);
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/products/search', async (req, res) => {
        try {
            const { q } = req.query;
            const products = await db.all(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = 1 AND (
          p.name LIKE ? OR 
          p.description LIKE ? OR 
          p.sku LIKE ? OR 
          p.barcode LIKE ?
        )
        ORDER BY p.name
        LIMIT 20
      `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/products', async (req, res) => {
        try {
            const { name, description, category_id, price, cost_price, stock_quantity, sku, barcode, unit } = req.body;
            const result = await db.run(`
        INSERT INTO products 
        (name, description, category_id, price, cost_price, stock_quantity, sku, barcode, unit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, description, category_id, price, cost_price || 0, stock_quantity || 0, sku, barcode, unit || 'pcs']);
            res.json({ id: result.id, success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/products/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, category_id, price, cost_price, stock_quantity, sku, barcode, unit } = req.body;

            await db.run(`
        UPDATE products 
        SET name = ?, description = ?, category_id = ?, price = ?, cost_price = ?, 
            stock_quantity = ?, sku = ?, barcode = ?, unit = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, description, category_id, price, cost_price, stock_quantity, sku, barcode, unit, id]);

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Customers Routes
    app.get('/api/customers', async (req, res) => {
        try {
            const customers = await db.all('SELECT * FROM customers ORDER BY name');
            res.json(customers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/customers', async (req, res) => {
        try {
            const { name, email, phone, address, customer_type } = req.body;
            const result = await db.run(`
        INSERT INTO customers (name, email, phone, address, customer_type)
        VALUES (?, ?, ?, ?, ?)
      `, [name, email, phone, address, customer_type || 'regular']);
            res.json({ id: result.id, success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Bills Routes
    app.get('/api/bills', async (req, res) => {
        try {
            const { page = 1, limit = 50, start_date, end_date } = req.query;
            const offset = (page - 1) * limit;

            let sql = 'SELECT * FROM bills';
            let params = [];

            if (start_date && end_date) {
                sql += ' WHERE created_at BETWEEN ? AND ?';
                params.push(start_date, end_date);
            }

            sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const bills = await db.all(sql, params);
            res.json(bills);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/bills/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const bill = await db.get('SELECT * FROM bills WHERE id = ?', [id]);

            if (!bill) {
                return res.status(404).json({ error: 'Bill not found' });
            }

            const items = await db.all('SELECT * FROM bill_items WHERE bill_id = ?', [id]);

            res.json({ ...bill, items });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/bills', async (req, res) => {
        try {
            const { customer_id, customer_name, items, discount_amount = 0, payment_method = 'cash', notes = '' } = req.body;

            // Calculate totals
            let subtotal = 0;
            items.forEach(item => {
                subtotal += item.quantity * item.unit_price;
            });

            // Get tax rate from business settings
            const settings = await db.get('SELECT tax_rate FROM business_settings LIMIT 1');
            const taxRate = settings ? settings.tax_rate : 0;
            const taxAmount = (subtotal - discount_amount) * (taxRate / 100);
            const totalAmount = subtotal - discount_amount + taxAmount;

            // Generate bill number
            const billNumber = `BILL-${Date.now()}`;

            // Insert bill
            const billResult = await db.run(`
        INSERT INTO bills 
        (bill_number, customer_id, customer_name, subtotal, tax_amount, discount_amount, 
         total_amount, payment_method, payment_status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)
      `, [billNumber, customer_id, customer_name, subtotal, taxAmount, discount_amount,
                totalAmount, payment_method, notes]);

            // Insert bill items
            for (const item of items) {
                await db.run(`
          INSERT INTO bill_items 
          (bill_id, product_id, product_name, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [billResult.id, item.product_id, item.product_name, item.quantity,
                item.unit_price, item.quantity * item.unit_price]);

                // Update stock if product exists
                if (item.product_id) {
                    await db.run(`
            UPDATE products 
            SET stock_quantity = stock_quantity - ? 
            WHERE id = ?
          `, [item.quantity, item.product_id]);
                }
            }

            res.json({
                id: billResult.id,
                bill_number: billNumber,
                total_amount: totalAmount,
                success: true
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Reports Routes
    app.get('/api/reports/daily-sales', async (req, res) => {
        try {
            const { date = moment().format('YYYY-MM-DD') } = req.query;

            const stats = await db.get(`
        SELECT 
          COUNT(*) as total_bills,
          COALESCE(SUM(total_amount), 0) as total_sales,
          COALESCE(SUM(tax_amount), 0) as total_tax,
          COALESCE(AVG(total_amount), 0) as average_bill
        FROM bills 
        WHERE DATE(created_at) = ?
      `, [date]);

            const topProducts = await db.all(`
        SELECT 
          bi.product_name,
          SUM(bi.quantity) as total_quantity,
          SUM(bi.total_price) as total_sales
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        WHERE DATE(b.created_at) = ?
        GROUP BY bi.product_name
        ORDER BY total_sales DESC
        LIMIT 10
      `, [date]);

            res.json({ stats, topProducts });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/reports/monthly-sales', async (req, res) => {
        try {
            const { month = moment().format('YYYY-MM') } = req.query;

            const dailySales = await db.all(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as bills_count,
          SUM(total_amount) as total_sales
        FROM bills 
        WHERE strftime('%Y-%m', created_at) = ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [month]);

            const monthlyStats = await db.get(`
        SELECT 
          COUNT(*) as total_bills,
          COALESCE(SUM(total_amount), 0) as total_sales,
          COALESCE(SUM(tax_amount), 0) as total_tax
        FROM bills 
        WHERE strftime('%Y-%m', created_at) = ?
      `, [month]);

            res.json({ dailySales, monthlyStats });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Dashboard stats
    app.get('/api/dashboard/stats', async (req, res) => {
        try {
            const today = moment().format('YYYY-MM-DD');
            const thisMonth = moment().format('YYYY-MM');

            const todayStats = await db.get(`
        SELECT 
          COUNT(*) as today_bills,
          COALESCE(SUM(total_amount), 0) as today_sales
        FROM bills 
        WHERE DATE(created_at) = ?
      `, [today]);

            const monthStats = await db.get(`
        SELECT 
          COUNT(*) as month_bills,
          COALESCE(SUM(total_amount), 0) as month_sales
        FROM bills 
        WHERE strftime('%Y-%m', created_at) = ?
      `, [thisMonth]);

            const productCount = await db.get('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
            const customerCount = await db.get('SELECT COUNT(*) as count FROM customers');

            res.json({
                today_bills: todayStats.today_bills,
                today_sales: todayStats.today_sales,
                month_bills: monthStats.month_bills,
                month_sales: monthStats.month_sales,
                total_products: productCount.count,
                total_customers: customerCount.count
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};
