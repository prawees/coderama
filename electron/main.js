const { app, BrowserWindow } = require('electron');
const serve = require('electron-serve').default || require('electron-serve');
const path = require('path');

const loadURL = serve({ directory: path.join(__dirname, '../out') });

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 450,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true 
    }
  });

  loadURL(mainWindow);
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
