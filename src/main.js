const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('./database');

// Initialize database
const db = new Database();

// Express server
const server = express();
server.use(cors());
server.use(bodyParser.json());
server.use(express.static(path.join(__dirname, 'renderer')));

// API Routes
require('./routes/api')(server, db);

// Start server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'assets/icon.png'),
        show: false
    });

    // Load the main page
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Create menu
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Bill',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('new-bill');
                    }
                },
                {
                    label: 'Settings',
                    click: () => {
                        mainWindow.webContents.send('open-settings');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Reports',
            submenu: [
                {
                    label: 'Daily Sales',
                    click: () => {
                        mainWindow.webContents.send('show-daily-report');
                    }
                },
                {
                    label: 'Monthly Sales',
                    click: () => {
                        mainWindow.webContents.send('show-monthly-report');
                    }
                },
                {
                    label: 'Product Report',
                    click: () => {
                        mainWindow.webContents.send('show-product-report');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.handle('close-window', () => {
    mainWindow.close();
});