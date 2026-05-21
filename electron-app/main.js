/* ============================================
   LE PARADISIER MANAGER - Electron Main Process
   Application desktop Windows/Mac/Linux
   ============================================ */

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

// Garder une référence globale de la fenêtre
let mainWindow;

// Configuration de l'application
const APP_CONFIG = {
    name: 'Le Paradisier Manager',
    version: '2.0.0',
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700
};

// Créer la fenêtre principale
function createWindow() {
    mainWindow = new BrowserWindow({
        width: APP_CONFIG.width,
        height: APP_CONFIG.height,
        minWidth: APP_CONFIG.minWidth,
        minHeight: APP_CONFIG.minHeight,
        title: APP_CONFIG.name,
        icon: path.join(__dirname, 'build', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false
        },
        backgroundColor: '#0F3D3A',
        show: false,
        autoHideMenuBar: false
    });

    // Charger l'application
    mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

    // Afficher la fenêtre quand elle est prête
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // Gérer la fermeture
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Empêcher la navigation externe
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith('file://')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    // Ouvrir les liens externes dans le navigateur par défaut
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Créer le menu
    createMenu();
}

// Créer le menu de l'application
function createMenu() {
    const template = [
        {
            label: 'Fichier',
            submenu: [
                {
                    label: 'Exporter les données',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('window.exportAllData && window.exportAllData()');
                    }
                },
                {
                    label: 'Importer les données',
                    accelerator: 'CmdOrCtrl+I',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(
                            'document.getElementById("importFile")?.click()'
                        );
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quitter',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'Affichage',
            submenu: [
                {
                    label: 'Actualiser',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.reload()
                },
                {
                    label: 'Plein écran',
                    accelerator: 'F11',
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                },
                { type: 'separator' },
                {
                    label: 'Zoom +',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        const zoom = mainWindow.webContents.getZoomFactor();
                        mainWindow.webContents.setZoomFactor(Math.min(zoom + 0.1, 2));
                    }
                },
                {
                    label: 'Zoom -',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        const zoom = mainWindow.webContents.getZoomFactor();
                        mainWindow.webContents.setZoomFactor(Math.max(zoom - 0.1, 0.5));
                    }
                },
                {
                    label: 'Zoom normal',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => mainWindow.webContents.setZoomFactor(1)
                }
            ]
        },
        {
            label: 'Navigation',
            submenu: [
                { label: 'Tableau de bord', click: () => navigate('dashboard') },
                { label: 'Réservations', click: () => navigate('reservations') },
                { label: 'Restaurant', click: () => navigate('restaurant') },
                { label: 'Clients', click: () => navigate('clients') },
                { type: 'separator' },
                { label: 'Paramètres', click: () => navigate('settings') },
                { label: 'Sauvegarde', click: () => navigate('backup') }
            ]
        },
        {
            label: 'Aide',
            submenu: [
                {
                    label: 'À propos',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'À propos',
                            message: APP_CONFIG.name,
                            detail: `Version ${APP_CONFIG.version}\n\nApplication de gestion pour hôtel et restaurant.\nFonctionne 100% hors-ligne.\n\n© 2024 Le Paradisier`
                        });
                    }
                },
                {
                    label: 'Documentation',
                    click: () => navigate('backup')
                }
            ]
        }
    ];

    // Menu spécifique macOS
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about', label: 'À propos' },
                { type: 'separator' },
                { role: 'hide', label: 'Masquer' },
                { role: 'hideOthers', label: 'Masquer les autres' },
                { role: 'unhide', label: 'Tout afficher' },
                { type: 'separator' },
                { role: 'quit', label: 'Quitter' }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Helper pour naviguer
function navigate(module) {
    mainWindow.webContents.executeJavaScript(`window.navigateTo && window.navigateTo('${module}')`);
}

// Quand Electron est prêt
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quitter quand toutes les fenêtres sont fermées (sauf macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Sécurité : empêcher la création de nouvelles fenêtres
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event) => {
        event.preventDefault();
    });
});
