const {app, Menu, Tray, BrowserWindow, ipcMain} = require('electron');
const electron = require('electron');
const net = require('net');
const client = new net.Socket();

const Store = require('electron-store');
const store = new Store();

let welcomeWindow = null;
let trayWindow = null;
let settingsWindow = null;
let confirmReceiveWindow=null;
let tray = null;
const debug = false;


function createWelcomeWindow() {
    if (debug) {
        welcomeWindow = new BrowserWindow({
            frame: false,
            show: false,
            width: 854,
            height: 500,
            resizable: false,
            webPreferences: {
                nodeIntegration: true
            }
        });
    } else {
        welcomeWindow = new BrowserWindow({
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

    welcomeWindow.loadFile('app/welcome.html');

    welcomeWindow.once('ready-to-show', () => {
        if (debug) {
            welcomeWindow.webContents.openDevTools();
        }

        welcomeWindow.show()
    });

    welcomeWindow.on('closed', () => {
        welcomeWindow = null
    })
}

function createTrayWindow() {
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    if (debug) {
        trayWindow = new BrowserWindow({
            alwaysOnTop: true,
            frame: false,
            show: false,
            width: 854,
            height: 340,
            x: width - 854,
            y: height - 340,
            resizable: false,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true
            }
        });
    } else {
        trayWindow = new BrowserWindow({
            alwaysOnTop: true,
            frame: false,
            show: false,
            width: 300,
            height: 340,
            x: width - 300,
            y: height - 340,
            resizable: false,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true
            }
        });
    }


    trayWindow.loadFile('app/tray.html');

    trayWindow.once('ready-to-show', () => {
        if (debug) {
            trayWindow.webContents.openDevTools()
        }
        trayWindow.show()
    });

    trayWindow.on('closed', () => {
        trayWindow = null
    });
}

function createTrayIcon() {
    tray = new Tray('app/image/ic_icon.png');
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Exit', click() {
                app.quit()
            }
        },
    ]);
    tray.setToolTip(store.get("device_name") + ": ready");
    tray.setContextMenu(contextMenu);
    tray.on("click", () => {
        if (trayWindow === null) {
            createTrayWindow()
        } else {
            trayWindow.show()
        }
    });
}

function createSettingsWindow() {
    if (debug) {
        settingsWindow = new BrowserWindow({
            frame: false,
            show: false,
            width: 954,
            height: 600,
            webPreferences: {
                nodeIntegration: true
            }
        });
    } else {
        settingsWindow = new BrowserWindow({
            frame: false,
            show: false,
            width: 400,
            height: 600,
            webPreferences: {
                nodeIntegration: true
            }
        });
    }

    settingsWindow.loadFile('app/settings.html');

    settingsWindow.once('ready-to-show', () => {
        if (debug) {
            settingsWindow.webContents.openDevTools();
        }

        settingsWindow.show()
    });

    settingsWindow.on('closed', () => {
        settingsWindow = null
    })

}

function createConfirmReceiveWindow(senderName,fileName){
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    if (debug) {
        confirmReceiveWindow = new BrowserWindow({
            alwaysOnTop: true,
            frame: false,
            show: false,
            width: 854,
            height: 100,
            x: width - 854,
            y: height - 100,
            resizable: false,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true
            }
        });
    } else {
        confirmReceiveWindow = new BrowserWindow({
            alwaysOnTop: true,
            frame: false,
            show: false,
            width: 300,
            height: 100,
            x: width - 300,
            y: height - 100,
            resizable: false,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true
            }
        });
    }

    confirmReceiveWindow.loadFile('app/confirm_receive.html');

    // confirmReceiveWindow.webContents.on('did-finish-load', () => {

    // });

    confirmReceiveWindow.once('ready-to-show', () => {
        if (debug) {
            confirmReceiveWindow.webContents.openDevTools();
        }

        confirmReceiveWindow.webContents.send('pass-data', {
            window:"confirm_receive",
            sender_name:senderName,
            file_name:fileName
        });

        confirmReceiveWindow.show()
    });

    confirmReceiveWindow.on('closed', () => {
        confirmReceiveWindow = null
    })
}

function connectServer(){
    client.connect(4389, "test.pegasis.site", function() {
        console.log('CONNECTED TO: ' + "test.pegasis.site" + ':' + 4389);
    });

    client.on('data', function(data) {
        console.log('DATA: ' + data);
        data=JSON.parse(data);
        createConfirmReceiveWindow(data.sender_name,data.file_name)
    });

    client.on('close', function() {
        console.log('Connection closed');
    });
}

app.on('ready', () => {
    if (debug) {
        // createWelcomeWindow()
        createTrayIcon();
        connectServer();
        // createTrayWindow();
    } else {
        let deviceName = store.get("device_name");
        if (deviceName === undefined) {
            createWelcomeWindow();
        } else {
            createTrayIcon();
            connectServer();
        }
    }

});

app.on('window-all-closed', () => {
});

ipcMain.on("window-operation", (event, arg) => {
    if (arg.window === "welcome" && arg.operation === "close") {
        welcomeWindow.close();
        app.quit();
    } else if (arg.window === "tray" && arg.operation === "minimize") {
        trayWindow.hide();
    } else if (arg.window === "settings") {
        if (arg.operation === "close") {
            settingsWindow.close();
        } else {
            settingsWindow.minimize();
        }
    }else if(arg.window === "confirm_receive"){
        confirmReceiveWindow.close()
    }
});

ipcMain.on("new-page", (event, arg) => {
    if (arg.from === "welcome" && arg.to === "tray") {
        welcomeWindow.close();
        createTrayIcon();
        createTrayWindow();
    } else if (arg.from === "tray" && arg.to === "settings") {
        if (settingsWindow != null) {
            settingsWindow.restore();
        } else {
            createSettingsWindow();
        }
    }
});