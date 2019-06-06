const {app, BrowserWindow, ipcMain} = require('electron');

let win;
const debug=true;

function createWindow() {
    if (debug) {
        win = new BrowserWindow({
            frame: false,
            show: false,
            width: 854,
            height: 500,
            resizable: false,
            webPreferences: {
                nodeIntegration: true
            }
        });
    }else {
        win = new BrowserWindow({
            frame: false,
            show: false,
            width: 300,
            height: 500,
            resizable: false,
            webPreferences: {
                nodeIntegration: true
            }
        });
    }


    win.loadFile('app/index.html');

    win.once('ready-to-show', () => {
        if (debug){
            win.webContents.openDevTools();
        }

        win.show()
    });

    win.on('closed', () => {
        win = null
    })
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
});

ipcMain.on("window-operation", (event, arg) => {

    if (arg==="close"){
        app.quit();
    } else {
        win.minimize();

    }
});