"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  openFileDialog: () => electron.ipcRenderer.invoke("select-json"),
  fetchAudio: (path) => electron.ipcRenderer.invoke("fetch-audio", path),
  resolvePath: (base, rel) => electron.ipcRenderer.invoke("resolve-path", base, rel)
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
