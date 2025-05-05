const { app, BrowserWindow } = require('electron');
const path = require('path');

// create the main window
function createWindow() {
    const win = new BrowserWindow({
        width: 1050,
        height: 700,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            devTools: false,
            sandbox: false,
            nodeIntegration: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});