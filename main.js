const {app, Menu, Tray, BrowserWindow, ipcMain} = require('electron');
const electron = require('electron');
const Store = require('electron-store');
const store = new Store();

let welcomeWindow=null;
let trayWindow=null;
let tray=null;
const debug=true;


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
    }else {
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
        if (debug){
            welcomeWindow.webContents.openDevTools();
        }

        welcomeWindow.show()
    });

    welcomeWindow.on('closed', () => {
        welcomeWindow = null
    })
}

function createTrayWindow(){
    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
    trayWindow = new BrowserWindow({
        alwaysOnTop: true,
        frame: false,
        show: false,
        width: 300,
        height: 300,
        x: width-300,
        y: height-300,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    trayWindow.loadFile('app/tray.html');

    trayWindow.once('ready-to-show', () => {
        trayWindow.show()
    });

    trayWindow.on('closed', () => {
        trayWindow = null
    });
}

function createTrayIcon(){
    tray = new Tray('app/image/ic_icon.png');
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Exit',click(){app.quit()} },
    ]);
    tray.setToolTip(store.get("device_name")+": ready");
    tray.setContextMenu(contextMenu);
    tray.on("click",()=>{
        if (trayWindow === null) {
            createTrayWindow()
        }else {
            trayWindow.show()
        }
    });
}

function createSettingsWindow(){

}

app.on('ready', () =>{
    let deviceName=store.get("device_name");
    if (deviceName===undefined){
        createWelcomeWindow();
    } else {
        createTrayIcon();
        if (debug){
            createTrayWindow();
        }
    }

});

app.on('window-all-closed', () => { });

ipcMain.on("window-operation", (event, arg) => {
    if (arg.window==="welcome" && arg.operation==="close"){
        welcomeWindow.close();
        app.quit();
    }else if (arg.window==="tray" && arg.operation==="minimize"){
        trayWindow.hide();
    }
});

ipcMain.on("new-page",(event,arg) =>{
    if (arg.from === "welcome" && arg.to==="tray"){
        welcomeWindow.close();
        createTrayIcon();
        createTrayWindow();
    }
});