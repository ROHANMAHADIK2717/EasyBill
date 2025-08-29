// Global variables
let currentBillItems = [];
let businessSettings = {};
let products = [];
let customers = [];
let categories = [];

const API_BASE = 'http://localhost:3001/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    loadBusinessSettings();
    loadDashboardStats();
    showSection('dashboard');
    updateTime();
    setInterval(updateTime, 1000);

    // Setup event listeners
    setupEventListeners();

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('daily-report-date').value = today;
    document.getElementById('monthly-report-month').value = today.substr(0, 7);
    document.getElementById('bills-start-date').value = today;
    document.getElementById('bills-end-date').value = today;
});

function setupEventListeners() {
    // Mobile menu toggle
    document.getElementById('mobile-menu-btn').addEventListener('click', function () {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Product search
    const productSearch = document.getElementById('product-search');
    productSearch.addEventListener('input', debounce(searchProducts, 300));
    productSearch.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const suggestions = document.getElementById('product-suggestions');
            const firstItem = suggestions.querySelector('.suggestion-item');
            if (firstItem) {
                firstItem.click();
            }
        }
    });

    // Bill calculation updates
    document.getElementById('discount-amount').addEventListener('input', calculateBillTotal);

    // Form submissions
    document.getElementById('settings-form').addEventListener('submit', saveBusinessSettings);
    document.getElementById('add-product-form').addEventListener('submit', saveProduct);
    document.getElementById('add-customer-form').addEventListener('submit', saveCustomer);

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#product-search') && !e.target.closest('#product-suggestions')) {
            document.getElementById('product-suggestions').classList.add('hidden');
        }
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatCurrency(amount) {
    const currency = businessSettings.currency || 'USD';
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };
    return `${symbols[currency] || '$'}${parseFloat(amount || 0).toFixed(2)}`;
}

function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString();
}

// API functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        showNotification('An error occurred. Please try again.', 'error');
        throw error;
    }
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.remove('hidden');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'new-bill': 'New Bill',
        'bills': 'Bills History',
        'products': 'Products',
        'customers': 'Customers',
        'reports': 'Reports',
        'settings': 'Settings'
    };
    document.getElementById('page-title').textContent = titles[sectionName];

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-gray-700');
    });

    // Load section-specific data
    switch (sectionName) {
        case 'dashboard':
            loadDashboardStats();
            loadRecentBills();
            break;
        case 'new-bill':
            loadCustomers();
            loadProducts();
            break;
        case 'bills':
            loadBills();
            break;
        case 'products':
            loadProducts();
            loadCategories();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'settings':
            loadBusinessSettings();
            break;
    }

    // Close mobile menu
    document.getElementById('sidebar').classList.remove('active');
}

// Business Settings
async function loadBusinessSettings() {
    try {
        businessSettings = await apiRequest('/business-settings');

        if (businessSettings.name) {
            document.getElementById('business-name').textContent = businessSettings.name;
            document.getElementById('business-name-input').value = businessSettings.name || '';
            document.getElementById('business-type').value = businessSettings.business_type || 'general';
            document.getElementById('business-address').value = businessSettings.address || '';
            document.getElementById('business-phone').value = businessSettings.phone || '';
            document.getElementById('business-email').value = businessSettings.email || '';
            document.getElementById('business-currency').value = businessSettings.currency || 'USD';
            document.getElementById('business-tax-rate').value = businessSettings.tax_rate || 0;
            document.getElementById('business-tax-number').value = businessSettings.tax_number || '';
            document.getElementById('tax-rate').textContent = businessSettings.tax_rate || 0;
        }
    } catch (error) {
        console.error('Failed to load business settings:', error);
    }
}

async function saveBusinessSettings(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('business-name-input').value,
        business_type: document.getElementById('business-type').value,
        address: document.getElementById('business-address').value,
        phone: document.getElementById('business-phone').value,
        email: document.getElementById('business-email').value,
        currency: document.getElementById('business-currency').value,
        tax_rate: parseFloat(document.getElementById('business-tax-rate').value) || 0,
        tax_number: document.getElementById('business-tax-number').value
    };

    try {
        await apiRequest('/business-settings', {
            method: 'PUT',
            body: JSON.stringify(formData)
        });

        showNotification('Settings saved successfully!', 'success');
        loadBusinessSettings();
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// Dashboard
async function loadDashboardStats() {
    try {
        const stats = await apiRequest('/dashboard/stats');

        document.getElementById('today-bills').textContent = stats.today_bills;
        document.getElementById('dashboard-today-sales').textContent = formatCurrency(stats.today_sales);
        document.getElementById('today-sales').textContent = formatCurrency(stats.today_sales);
        document.getElementById('total-products').textContent = stats.total_products;
        document.getElementById('total-customers').textContent = stats.total_customers;
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

async function loadRecentBills() {
    try {
        const bills = await apiRequest('/bills?limit=5');
        const container = document.getElementById('recent-bills');

        if (bills.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No recent bills</p>';
            return;
        }

        container.innerHTML = bills.map(bill => `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                    <p class="font-semibold">${bill.bill_number}</p>
                    <p class="text-sm text-gray-600">${bill.customer_name || 'Walk-in Customer'}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold">${formatCurrency(bill.total_amount)}</p>
                    <p class="text-sm text-gray-600">${new Date(bill.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load recent bills:', error);
    }
}

// Products
async function loadProducts() {
    try {
        products = await apiRequest('/products');
        displayProducts();
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function displayProducts() {
    const container = document.getElementById('products-list');

    if (products.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-gray-500">No products found</td></tr>';
        return;
    }

    container.innerHTML = products.map(product => `
        <tr class="border-b border-gray-200">
            <td class="p-4">${product.name}</td>
            <td class="p-4">${product.category_name || 'N/A'}</td>
            <td class="p-4">${formatCurrency(product.price)}</td>
            <td class="p-4">${product.stock_quantity} ${product.unit}</td>
            <td class="p-4">${product.sku || 'N/A'}</td>
            <td class="p-4">
                <button onclick="editProduct(${product.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct(${product.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadCategories() {
    try {
        categories = await apiRequest('/categories');
        const select = document.getElementById('product-category');
        select.innerHTML = categories.map(cat =>
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function searchProducts() {
    const query = document.getElementById('product-search').value.trim();
    if (query.length < 2) {
        document.getElementById('product-suggestions').classList.add('hidden');
        return;
    }

    try {
        const results = await apiRequest(`/products/search?q=${encodeURIComponent(query)}`);
        displayProductSuggestions(results);
    } catch (error) {
        console.error('Failed to search products:', error);
    }
}

function displayProductSuggestions(products) {
    const container = document.getElementById('product-suggestions');

    if (products.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="suggestion-item p-3 hover:bg-gray-100 cursor-pointer border-b" 
             onclick="addProductToBill(${JSON.stringify(product).replace(/"/g, '&quot;')})">
            <div class="flex justify-between">
                <span class="font-medium">${product.name}</span>
                <span class="text-blue-600">${formatCurrency(product.price)}</span>
            </div>
            <div class="text-sm text-gray-600">
                Stock: ${product.stock_quantity} ${product.unit} | SKU: ${product.sku || 'N/A'}
            </div>
        </div>
    `).join('');

    container.classList.remove('hidden');
}

function showAddProductModal() {
    loadCategories();
    document.getElementById('add-product-modal').classList.remove('hidden');
}

async function saveProduct(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        category_id: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        cost_price: parseFloat(document.getElementById('product-cost').value) || 0,
        stock_quantity: parseInt(document.getElementById('product-stock').value) || 0,
        unit: document.getElementById('product-unit').value || 'pcs',
        sku: document.getElementById('product-sku').value
    };

    try {
        await apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showNotification('Product added successfully!', 'success');
        closeModal('add-product-modal');
        loadProducts();
        document.getElementById('add-product-form').reset();
    } catch (error) {
        console.error('Failed to save product:', error);
    }
}

// Customers
async function loadCustomers() {
    try {
        customers = await apiRequest('/customers');
        displayCustomers();
        updateCustomerSelect();
    } catch (error) {
        console.error('Failed to load customers:', error);
    }
}

function displayCustomers() {
    const container = document.getElementById('customers-list');

    if (customers.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-gray-500">No customers found</td></tr>';
        return;
    }

    container.innerHTML = customers.map(customer => `
        <tr class="border-b border-gray-200">
            <td class="p-4">${customer.name}</td>
            <td class="p-4">${customer.email || 'N/A'}</td>
            <td class="p-4">${customer.phone || 'N/A'}</td>
            <td class="p-4">${customer.customer_type}</td>
            <td class="p-4">
                <button onclick="editCustomer(${customer.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCustomer(${customer.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateCustomerSelect() {
    const select = document.getElementById('customer-select');
    select.innerHTML = '<option value="">Walk-in Customer</option>' +
        customers.map(customer =>
            `<option value="${customer.id}" data-name="${customer.name}">${customer.name}</option>`
        ).join('');
}

function showAddCustomerModal() {
    document.getElementById('add-customer-modal').classList.remove('hidden');
}

async function saveCustomer(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        address: document.getElementById('customer-address').value,
        customer_type: document.getElementById('customer-type').value
    };

    try {
        await apiRequest('/customers', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showNotification('Customer added successfully!', 'success');
        closeModal('add-customer-modal');
        loadCustomers();
        document.getElementById('add-customer-form').reset();
    } catch (error) {
        console.error('Failed to save customer:', error);
    }
}

// Bill Management
function addProductToBill(product) {
    const existingItem = currentBillItems.find(item => item.product_id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.total_price = existingItem.quantity * existingItem.unit_price;
    } else {
        currentBillItems.push({
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            unit_price: product.price,
            total_price: product.price
        });
    }

    document.getElementById('product-search').value = '';
    document.getElementById('product-suggestions').classList.add('hidden');
    displayBillItems();
    calculateBillTotal();
}

// function addCustomItem() {
//     const name = prompt('Enter item name:');
//     if (!name) return;

//     const price = parseFloat(prompt('Enter price:'));
//     if (isNaN(price) || price < 0) return;

//     currentBillItems.push({
//         product_id: null,
//         product_name: name,
//         quantity: 1,
//         unit_price: price,
//         total_price: price
//     });

//     displayBillItems();
//     calculateBillTotal();
// }

function addCustomItem() {
    // Use the existing search input for item name
    const searchInput = document.getElementById('product-search');
    const name = searchInput.value.trim();

    if (!name) {
        alert('Please enter an item name in the search field first');
        searchInput.focus();
        return;
    }

    // Create a simple modal for price input
    showPriceModal(name);
}

function showPriceModal(itemName) {
    const modal = document.createElement('div');
    modal.id = 'price-modal';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div style="background: white; padding: 20px; border-radius: 8px; min-width: 300px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h3 style="margin: 0 0 15px 0; color: #374151;">Add Custom Item</h3>
                <p style="margin: 0 0 10px 0; color: #6B7280;">Item: <strong>${itemName}</strong></p>
                <input type="number" id="modal-price" placeholder="Enter price" step="0.01" min="0" 
                    style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px; margin-bottom: 15px;">
                <div style="text-align: right;">
                    <button onclick="closePriceModal()" 
                        style="margin-right: 10px; padding: 8px 16px; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Cancel
                    </button>
                    <button onclick="confirmCustomItem('${itemName}')" 
                        style="padding: 8px 16px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Add Item
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('modal-price').focus();

    // Allow Enter key to confirm
    document.getElementById('modal-price').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            confirmCustomItem(itemName);
        }
    });
}

function confirmCustomItem(itemName) {
    const price = parseFloat(document.getElementById('modal-price').value);

    if (isNaN(price) || price < 0) {
        alert('Please enter a valid price');
        return;
    }

    currentBillItems.push({
        product_id: null,
        product_name: itemName,
        quantity: 1,
        unit_price: price,
        total_price: price
    });

    // Clear the search input
    document.getElementById('product-search').value = '';

    displayBillItems();
    calculateBillTotal();
    closePriceModal();
}

function closePriceModal() {
    const modal = document.getElementById('price-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

function displayBillItems() {
    const container = document.getElementById('bill-items');

    if (currentBillItems.length === 0) {
        container.innerHTML = '<tr id="no-items-row"><td colspan="5" class="text-center p-8 text-gray-500">No items added</td></tr>';
        return;
    }

    container.innerHTML = currentBillItems.map((item, index) => `
        <tr class="border-b border-gray-200">
            <td class="p-3">${item.product_name}</td>
            <td class="p-3">
                <input type="number" value="${item.quantity}" min="1" step="0.01" 
                       class="w-20 p-1 border border-gray-300 rounded" 
                       onchange="updateItemQuantity(${index}, this.value)">
            </td>
            <td class="p-3">
                <input type="number" value="${item.unit_price}" min="0" step="0.01" 
                       class="w-24 p-1 border border-gray-300 rounded" 
                       onchange="updateItemPrice(${index}, this.value)">
            </td>
            <td class="p-3 font-semibold">${formatCurrency(item.total_price)}</td>
            <td class="p-3">
                <button onclick="removeItem(${index})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateItemQuantity(index, quantity) {
    const qty = parseFloat(quantity) || 1;
    currentBillItems[index].quantity = qty;
    currentBillItems[index].total_price = qty * currentBillItems[index].unit_price;
    displayBillItems();
    calculateBillTotal();
}

function updateItemPrice(index, price) {
    const unitPrice = parseFloat(price) || 0;
    currentBillItems[index].unit_price = unitPrice;
    currentBillItems[index].total_price = currentBillItems[index].quantity * unitPrice;
    displayBillItems();
    calculateBillTotal();
}

function removeItem(index) {
    currentBillItems.splice(index, 1);
    displayBillItems();
    calculateBillTotal();
}

function calculateBillTotal() {
    const subtotal = currentBillItems.reduce((sum, item) => sum + item.total_price, 0);
    const discount = parseFloat(document.getElementById('discount-amount').value) || 0;
    const taxRate = businessSettings.tax_rate || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('tax-amount').textContent = formatCurrency(taxAmount);
    document.getElementById('total-amount').textContent = formatCurrency(total);
}

async function saveBill() {
    if (currentBillItems.length === 0) {
        showNotification('Please add items to the bill', 'error');
        return;
    }

    const customerSelect = document.getElementById('customer-select');
    const customerOption = customerSelect.selectedOptions[0];

    const billData = {
        customer_id: customerSelect.value || null,
        customer_name: customerOption ? customerOption.dataset.name : 'Walk-in Customer',
        items: currentBillItems,
        discount_amount: parseFloat(document.getElementById('discount-amount').value) || 0,
        payment_method: document.getElementById('payment-method').value,
        notes: document.getElementById('bill-notes').value
    };

    try {
        const result = await apiRequest('/bills', {
            method: 'POST',
            body: JSON.stringify(billData)
        });

        showNotification('Bill saved successfully!', 'success');
        generateReceipt(result, billData);
        clearBill();
        loadDashboardStats();
    } catch (error) {
        console.error('Failed to save bill:', error);
    }
}

function generateReceipt(billResult, billData) {
    const receiptHtml = `
        <div class="text-center mb-4">
            <h2 class="font-bold text-lg">${businessSettings.name || 'My Business'}</h2>
            <p class="text-sm">${businessSettings.address || ''}</p>
            <p class="text-sm">Tel: ${businessSettings.phone || ''}</p>
            <p class="text-sm">Email: ${businessSettings.email || ''}</p>
            <hr class="my-2">
        </div>
        
        <div class="mb-4">
            <p><strong>Bill #:</strong> ${billResult.bill_number}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Customer:</strong> ${billData.customer_name}</p>
            <p><strong>Payment:</strong> ${billData.payment_method.toUpperCase()}</p>
        </div>
        
        <table class="w-full mb-4 text-sm">
            <thead>
                <tr>
                    <th class="text-left">Item</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${currentBillItems.map(item => `
                    <tr>
                        <td>${item.product_name}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${formatCurrency(item.unit_price)}</td>
                        <td class="text-right">${formatCurrency(item.total_price)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="text-right">
            <p>Subtotal: ${formatCurrency(currentBillItems.reduce((sum, item) => sum + item.total_price, 0))}</p>
            <p>Discount: ${formatCurrency(billData.discount_amount)}</p>
            <p>Tax: ${formatCurrency((currentBillItems.reduce((sum, item) => sum + item.total_price, 0) - billData.discount_amount) * ((businessSettings.tax_rate || 0) / 100))}</p>
            <p><strong>Total: ${formatCurrency(billResult.total_amount)}</strong></p>
        </div>
        
        <div class="text-center mt-4">
            <p class="text-sm">Thank you for your business!</p>
        </div>
    `;

    document.getElementById('receipt-print').innerHTML = receiptHtml;
    document.getElementById('receipt-print').classList.remove('hidden');

    setTimeout(() => {
        window.print();
        document.getElementById('receipt-print').classList.add('hidden');
    }, 100);
}

function clearBill() {
    currentBillItems = [];
    document.getElementById('customer-select').value = '';
    document.getElementById('payment-method').value = 'cash';
    document.getElementById('bill-notes').value = '';
    document.getElementById('discount-amount').value = '0';
    document.getElementById('product-search').value = '';
    displayBillItems();
    calculateBillTotal();
}

// Bills History
async function loadBills() {
    try {
        const bills = await apiRequest('/bills');
        displayBills(bills);
    } catch (error) {
        console.error('Failed to load bills:', error);
    }
}

function displayBills(bills) {
    const container = document.getElementById('bills-list');

    if (bills.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-gray-500">No bills found</td></tr>';
        return;
    }

    container.innerHTML = bills.map(bill => `
        <tr class="border-b border-gray-200">
            <td class="p-4 font-medium">${bill.bill_number}</td>
            <td class="p-4">${bill.customer_name || 'Walk-in Customer'}</td>
            <td class="p-4">${new Date(bill.created_at).toLocaleDateString()}</td>
            <td class="p-4 font-semibold">${formatCurrency(bill.total_amount)}</td>
            <td class="p-4">
                <span class="px-2 py-1 text-xs rounded ${bill.payment_method === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                    ${bill.payment_method.toUpperCase()}
                </span>
            </td>
            <td class="p-4">
                <button onclick="viewBill(${bill.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="printBill(${bill.id})" class="text-green-600 hover:text-green-800">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function filterBills() {
    const startDate = document.getElementById('bills-start-date').value;
    const endDate = document.getElementById('bills-end-date').value;

    let url = '/bills';
    if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
    }

    try {
        const bills = await apiRequest(url);
        displayBills(bills);
    } catch (error) {
        console.error('Failed to filter bills:', error);
    }
}

// Reports
async function loadDailyReport() {
    const date = document.getElementById('daily-report-date').value;
    if (!date) return;

    try {
        const report = await apiRequest(`/reports/daily-sales?date=${date}`);
        displayDailyReport(report);
    } catch (error) {
        console.error('Failed to load daily report:', error);
    }
}

function displayDailyReport(report) {
    const container = document.getElementById('daily-report-content');

    container.innerHTML = `
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 class="font-semibold mb-2">Sales Summary</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p>Total Bills: <strong>${report.stats.total_bills}</strong></p>
                    <p>Total Sales: <strong>${formatCurrency(report.stats.total_sales)}</strong></p>
                </div>
                <div>
                    <p>Total Tax: <strong>${formatCurrency(report.stats.total_tax)}</strong></p>
                    <p>Average Bill: <strong>${formatCurrency(report.stats.average_bill)}</strong></p>
                </div>
            </div>
        </div>
        
        ${report.topProducts.length > 0 ? `
            <div>
                <h4 class="font-semibold mb-2">Top Products</h4>
                <div class="space-y-2">
                    ${report.topProducts.map(product => `
                        <div class="flex justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>${product.product_name}</span>
                            <span>${formatCurrency(product.total_sales)} (${product.total_quantity} sold)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '<p class="text-gray-500">No products sold on this date</p>'}
    `;
}

async function loadMonthlyReport() {
    const month = document.getElementById('monthly-report-month').value;
    if (!month) return;

    try {
        const report = await apiRequest(`/reports/monthly-sales?month=${month}`);
        displayMonthlyReport(report);
    } catch (error) {
        console.error('Failed to load monthly report:', error);
    }
}

function displayMonthlyReport(report) {
    const container = document.getElementById('monthly-report-content');

    container.innerHTML = `
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 class="font-semibold mb-2">Monthly Summary</h4>
            <div class="text-sm">
                <p>Total Bills: <strong>${report.monthlyStats.total_bills}</strong></p>
                <p>Total Sales: <strong>${formatCurrency(report.monthlyStats.total_sales)}</strong></p>
                <p>Total Tax: <strong>${formatCurrency(report.monthlyStats.total_tax)}</strong></p>
            </div>
        </div>
        
        ${report.dailySales.length > 0 ? `
            <div>
                <h4 class="font-semibold mb-2">Daily Breakdown</h4>
                <div class="max-h-60 overflow-y-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-100 sticky top-0">
                            <tr>
                                <th class="text-left p-2">Date</th>
                                <th class="text-right p-2">Bills</th>
                                <th class="text-right p-2">Sales</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.dailySales.map(day => `
                                <tr class="border-b">
                                    <td class="p-2">${new Date(day.date).toLocaleDateString()}</td>
                                    <td class="text-right p-2">${day.bills_count}</td>
                                    <td class="text-right p-2">${formatCurrency(day.total_sales)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : '<p class="text-gray-500">No sales data for this month</p>'}
    `;
}

// Utility functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300 ${type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`;

    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
        } mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Placeholder functions for edit/delete operations
function editProduct(id) {
    showNotification('Edit product functionality coming soon!', 'info');
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        showNotification('Delete product functionality coming soon!', 'info');
    }
}

function editCustomer(id) {
    showNotification('Edit customer functionality coming soon!', 'info');
}

function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        showNotification('Delete customer functionality coming soon!', 'info');
    }
}

function viewBill(id) {
    showNotification('View bill details functionality coming soon!', 'info');
}

function printBill(id) {
    showNotification('Print bill functionality coming soon!', 'info');
}