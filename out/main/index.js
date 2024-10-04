"use strict";
const electron = require("electron");
const node_path = require("node:path");
const node_fs = require("node:fs");
const utils = require("@electron-toolkit/utils");
const path = require("path");
const icon = path.join(__dirname, "../../resources/icon.png");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: node_path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    mainWindow.openDevTools({ mode: "bottom" });
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(node_path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.handle("select-json", async () => {
    const { canceled, filePaths } = await electron.dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json", "jsong"] }]
    });
    if (canceled || filePaths.length === 0) return null;
    const filePath = filePaths[0];
    const folder = node_path.resolve(filePath, "..");
    const fileContent = node_fs.readFileSync(filePath, "utf-8");
    return { filePath, folder, content: JSON.parse(fileContent) };
  });
  electron.ipcMain.handle("fetch-audio", async (event, absPath) => {
    const fileContent = node_fs.readFileSync(absPath, "binary");
    const len = fileContent.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = fileContent.charCodeAt(i);
    }
    return bytes.buffer;
  });
  electron.ipcMain.handle("resolve-path", async (event, base, relative) => {
    return node_path.resolve(base, relative);
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
