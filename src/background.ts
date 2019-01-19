'use strict'
import { app, protocol, BrowserWindow, NativeImage, nativeImage } from 'electron'
import * as path from 'path'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'

import Config from './Config'
import Storage from './Storage';

protocol.registerStandardSchemes(['app'], { secure: true })
const isDevelopment = process.env.NODE_ENV !== 'production'
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null
let icon = nativeImage.createFromPath(path.join(__dirname, 'bundled/assets/icons', 'icon64.png'))
// Standard scheme must be registered before the app is ready
function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: Config.WINDOW_CONFIG.width,
    height: Config.WINDOW_CONFIG.height,
    icon: path.join(__dirname, 'bundled/assets/icons', 'icon64.png'),
    resizable: true,
    useContentSize: true,
    webPreferences: { webSecurity: false }

  })

  win.setMenu(null)
  win.moveTop()

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)

    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    // win.setIcon(nativeImage.createFromPath('app://./assets/icons/icon64.png'))
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools()
  }
  createWindow()
})

app.on('browser-window-created', () => {
  //
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}




// const isDevelopment = process.env.NODE_ENV !== 'production'

// // let win: BrowserWindow | null
// Storage.getInstance().window = null

// protocol.registerStandardSchemes(['app'], { secure: true })
// // let iconPath = path.join(__dirname, 'assets/icons/favicon.ico')
// // let iconPath = '/favicon.ico'
// function createWindow() {
//   console.log('adjns Auhd asuh ask')
//   // console.log(iconPath)

//   Storage.getInstance().window = new BrowserWindow({
//     width: Config.WINDOW_CONFIG.width,
//     height: Config.WINDOW_CONFIG.height,
//     resizable: false,
//     // titleBarStyle: "hidden",
//     // frame: false,
//     icon: path.join(__dirname, 'assets/icons/favicon.ico')
//   })
//   let win = Storage.getInstance().window
//   if (win) {
//     win.setMenu(null)
//     setInterval(() => {
//       if (win)
//         win.webContents.send('some', 'THIS IS OP')
//     }, 500)

//     if (process.env.WEBPACK_DEV_SERVER_URL) {
//       win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
//       if (!process.env.IS_TEST) win.webContents.openDevTools()
//     } else {
//       createProtocol('app')
//       win.loadURL('app://./index.html')
//     }

//     win.on('closed', () => {
//       win = null
//     })
//   }
// }

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// app.on('activate', () => {
//   if (Storage.getInstance().window === null) {
//     createWindow()
//   }
// })

// app.on('ready', async () => {
//   if (isDevelopment && !process.env.IS_TEST) {
//     await installVueDevtools()
//   }
//   createWindow()
// })

// if (isDevelopment) {
//   if (process.platform === 'win32') {
//     process.on('message', data => {
//       if (data === 'graceful-exit') {
//         app.quit()
//       }
//     })
//   } else {
//     process.on('SIGTERM', () => {
//       app.quit()
//     })
//   }
// }
