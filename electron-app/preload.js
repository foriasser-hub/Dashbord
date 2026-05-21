/* ============================================
   LE PARADISIER MANAGER - Electron Preload
   Bridge sécurisé entre Node.js et le renderer
   ============================================ */

const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Informations sur l'application
    getAppInfo: () => ({
        platform: process.platform,
        version: process.versions.electron,
        isElectron: true
    }),
    
    // Notification système
    showNotification: (title, body) => {
        new Notification(title, { body });
    }
});

// Indiquer que l'app tourne dans Electron
window.addEventListener('DOMContentLoaded', () => {
    // Ajouter une classe au body pour le styling spécifique Electron
    document.body.classList.add('electron-app');
    
    // Masquer le bouton d'installation PWA (pas nécessaire dans Electron)
    setTimeout(() => {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
        
        // Masquer le badge offline (Electron fonctionne toujours offline)
        const offlineBadge = document.getElementById('offlineBadge');
        if (offlineBadge) {
            offlineBadge.style.display = 'none';
        }
    }, 100);
});
