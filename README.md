# Universal Billing App - Project Structure & Setup

## 📁 Project Structure

```
universal-billing-app/
├── package.json
├── README.md
├── .gitignore
└── src/
    ├── main.js                 # Main Electron process
    ├── database.js            # SQLite database setup
    ├── routes/
    │   └── api.js             # Express API routes
    └── renderer/
        ├── index.html         # Main UI
        ├── js/
        │   └── app.js         # Frontend JavaScript
        └── assets/
            └── icon.png       # App icon (optional)
```

## 🚀 Setup Instructions

### 1. Initialize the Project
```bash
mkdir universal-billing-app
cd universal-billing-app
npm init -y
```

### 2. Install Dependencies
```bash
# Production dependencies
npm install electron express sqlite3 cors body-parser uuid moment

# Development dependencies  
npm install --save-dev electron-builder nodemon
```

### 3. Create Directory Structure
```bash
mkdir -p src/routes src/renderer/js src/renderer/assets
```

### 4. Copy Files
Place each file in its respective location according to the structure above.

### 5. Update package.json
Replace the generated package.json with the one provided in the artifacts.

### 6. Run the Application
```bash
# Development mode
npm run dev

# Or standard run
npm start
```

### 7. Build for Distribution
```bash
npm run build
```

## 🎯 Features

### Core Features
- ✅ **Dashboard** - Overview of daily sales, recent bills, and quick stats
- ✅ **Billing System** - Create bills with product search and custom items
- ✅ **Product Management** - Add, view, and manage products with categories
- ✅ **Customer Management** - Maintain customer database
- ✅ **Inventory Tracking** - Basic stock management
- ✅ **Reports** - Daily and monthly sales reports
- ✅ **Receipt Printing** - Thermal printer compatible receipts
- ✅ **Multi-Currency Support** - USD, EUR, GBP, INR, JPY
- ✅ **Tax Calculation** - Configurable tax rates
- ✅ **Business Settings** - Customizable business information

### Business Type Adaptations
The app can be easily customized for different business types:

- **Restaurant**: Menu items, table service, order management
- **Retail Store**: Product inventory, barcode support, categories
- **Clothing Store**: Size variants, seasonal collections
- **Electronics**: Model numbers, warranty tracking
- **Pharmacy**: Medicine inventory, prescription management
- **Grocery Store**: Weight-based items, bulk pricing
- **Salon/Spa**: Service-based billing, appointment integration

## 🛠️ Customization Guide

### Adding New Business Types
1. Update the business type dropdown in settings
2. Modify the product schema for business-specific fields
3. Customize the UI based on business requirements

### Database Schema Extensions
The SQLite database can be extended with additional tables:
```sql
-- For restaurants
CREATE TABLE tables (id INTEGER PRIMARY KEY, name TEXT, capacity INTEGER);

-- For appointments
CREATE TABLE appointments (id INTEGER PRIMARY KEY, customer_id INTEGER, service_id INTEGER, datetime DATETIME);

-- For variants (clothing sizes, colors)
CREATE TABLE product_variants (id INTEGER PRIMARY KEY, product_id INTEGER, variant_type TEXT, variant_value TEXT, price_adjustment REAL);
```

### UI Customizations
- Modify `src/renderer/index.html` for layout changes
- Update `src/renderer/js/app.js` for functionality
- Add custom CSS for business-specific themes

### API Extensions
Add new routes in `src/routes/api.js` for additional features:
```javascript
// Example: Table management for restaurants
app.get('/api/tables', async (req, res) => {
  const tables = await db.all('SELECT * FROM tables');
  res.json(tables);
});
```

## 📊 Database Tables

### Core Tables
- **business_settings**: Store configuration
- **categories**: Product categories
- **products**: Product/service catalog
- **customers**: Customer database
- **bills**: Invoice records
- **bill_items**: Line items for each bill

### Key Fields
- Products support: name, price, cost, stock, SKU, barcode
- Bills include: subtotal, tax, discount, payment method
- Full audit trail with timestamps

## 🎨 UI/UX Features

- **Responsive Design**: Works on different screen sizes
- **Dark Sidebar**: Professional appearance
- **Real-time Updates**: Live calculations and statistics
- **Search Functionality**: Quick product and customer lookup
- **Print Support**: Thermal receipt printing
- **Modal Dialogs**: Clean add/edit interfaces
- **Notifications**: User feedback system

## 🔧 Configuration Options

### Business Settings
- Business name and contact info
- Tax rates and currency
- Business type selection
- Logo upload (planned)

### Printing Setup
- Receipt template customization
- Printer configuration
- Paper size options

## 📈 Reporting Features

### Available Reports
- Daily sales summary
- Monthly sales breakdown
- Top selling products
- Customer purchase history
- Inventory status

### Export Options
- Print reports
- Export to CSV (planned)
- Email reports (planned)

## 🔒 Data Security

- Local SQLite database
- No cloud dependencies
- Automatic backups (planned)
- Data encryption (planned)

## 🚀 Future Enhancements

### Planned Features
- Barcode scanner integration
- Multiple payment methods
- Inventory alerts
- Customer loyalty program
- Multi-location support
- Data backup/restore
- Email receipts
- Advanced reporting
- Integration with accounting software

### Performance Optimizations
- Database indexing
- Lazy loading for large datasets
- Background data processing
- Memory management

## 🐛 Troubleshooting

### Common Issues
1. **Database errors**: Check file permissions in userData folder
2. **Print issues**: Ensure printer drivers are installed
3. **Port conflicts**: Change port in main.js if 3001 is occupied
4. **Build errors**: Ensure all dependencies are installed

### Debug Mode
Set environment variable for debugging:
```bash
export DEBUG=1
npm start
```

## 📞 Support

For customization requests or technical support:
- Check the GitHub issues
- Review the documentation
- Submit feature requests

---

This billing application provides a solid foundation that can be adapted for various business types while maintaining professional functionality and user experience.