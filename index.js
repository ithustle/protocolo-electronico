const { app, BrowserWindow } = require('electron');
const path = require("path");
const url = require("url");

let win;

app.on("window-all-closed", () => {
    if (process.platform != "darwin") {
        app.quit();
    }
});

app.on("ready", () => {
    win = new BrowserWindow(
        {
            width: 1250,
            height: 750, 
            resizable: false, 
            fullscreenable: false,
            webPreferences: {
                nodeIntegration: true
            }
        }
    );

    win.loadURL(url.format({
        pathname: path.join(__dirname, "index.html", ),
        protocol: "file",
        
        slashes: true
    }));

    //win.webContents.openDevTools();

    win.on("closed", () => win = null);
});