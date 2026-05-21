/* ============================================
   LE PARADISIER MANAGER - Application Locale
   Version 100% hors-ligne - Aucun backend requis
   ============================================ */

// ===== CONFIGURATION =====
const APP_CONFIG = {
    name: 'Le Paradisier Manager',
    version: '2.0.0',
    currency: 'Ar',
    
    // Paramètres par défaut (personnalisables)
    defaults: {
        establishmentName: 'Le Paradisier',
        phone: '+261 34 00 000 00',
        address: 'Toamasina, Madagascar',
        currency: 'Ar',
        logo: '🌴'
    }
};

// ===== ÉTAT GLOBAL =====
let currentModule = 'dashboard';
let charts = {};
let settings = {};
let undoStack = []; // Pour la fonction annuler

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser le stockage
    await LocalStorage.init();
    
    // Migrer les anciennes données si nécessaire
    await LocalStorage.migrateFromOldFormat();
    
    // Initialiser l'authentification
    await LocalAuth.init();
    
    // Vérifier si connecté
    if (!LocalAuth.isAuthenticated()) {
        showLoginScreen();
    } else if (LocalAuth.currentUser?.mustChangePassword) {
        showForceChangePasswordScreen();
    } else {
        await initApp();
    }
});

// ===== ÉCRAN DE CONNEXION =====
function showLoginScreen() {
    document.body.innerHTML = `
    <div class="login-container">
        <div class="login-box">
            <div class="login-header">
                <span class="login-logo">🌴</span>
                <h1>Le Paradisier</h1>
                <p>Manager - Mode Local</p>
            </div>
            <form id="loginForm">
                <div class="login-form-group">
                    <label for="password"><i class="fas fa-lock"></i> Mot de passe</label>
                    <input type="password" id="password" name="password" class="login-input" 
                           required autocomplete="current-password" placeholder="Votre mot de passe">
                </div>
                <div id="loginError" class="login-error" style="display:none"></div>
                <button type="submit" class="login-btn" id="loginBtn">
                    <i class="fas fa-sign-in-alt"></i> Accéder
                </button>
            </form>
            <div class="login-footer">
                <p><i class="fas fa-hdd"></i> Application locale hors-ligne</p>
                <small>Première connexion : admin123</small>
            </div>
        </div>
    </div>`;
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const btn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');
    const password = document.getElementById('password').value;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    errorDiv.style.display = 'none';
    
    const result = await LocalAuth.login(password);
    
    if (result.success) {
        if (result.mustChangePassword) {
            showForceChangePasswordScreen();
        } else {
            window.location.reload();
        }
    } else {
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Accéder';
    }
}

// ===== CHANGEMENT MOT DE PASSE OBLIGATOIRE =====
function showForceChangePasswordScreen() {
    document.body.innerHTML = `
    <div class="login-container">
        <div class="login-box">
            <div class="login-header">
                <span class="login-logo">🔐</span>
                <h1>Nouveau mot de passe</h1>
                <p>Configurez votre mot de passe personnel</p>
            </div>
            <form id="changePasswordForm">
                <div class="login-form-group">
                    <label><i class="fas fa-key"></i> Nouveau mot de passe</label>
                    <input type="password" id="newPassword" class="login-input" 
                           required minlength="6" placeholder="Minimum 6 caractères">
                </div>
                <div class="login-form-group">
                    <label><i class="fas fa-check-double"></i> Confirmer</label>
                    <input type="password" id="confirmPassword" class="login-input" 
                           required placeholder="Répétez le mot de passe">
                </div>
                <div id="changeError" class="login-error" style="display:none"></div>
                <button type="submit" class="login-btn">
                    <i class="fas fa-save"></i> Enregistrer
                </button>
            </form>
        </div>
    </div>`;
    
    document.getElementById('changePasswordForm').addEventListener('submit', handleForceChangePassword);
}

async function handleForceChangePassword(e) {
    e.preventDefault();
    
    const errorDiv = document.getElementById('changeError');
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Les mots de passe ne correspondent pas';
        errorDiv.style.display = 'block';
        return;
    }
    
    const result = await LocalAuth.changePassword('admin123', newPassword);
    
    if (result.success) {
        alert('Mot de passe configuré ! Reconnectez-vous.');
        LocalAuth.logout();
    } else {
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
    }
}

// ===== INITIALISATION APP =====
async function initApp() {
    // Charger les paramètres
    settings = await loadSettings();
    
    // Charger les données de démo si vide
    await loadDemoDataIfEmpty();
    
    // Construire l'interface
    buildAppInterface();
    
    // Attacher les événements
    attachEventListeners();
    
    // Mettre à jour la date
    updateDate();
    
    // Naviguer au dashboard
    navigateTo('dashboard');
    
    // Vérifier si PWA installable
    checkPWAInstall();
}

async function loadSettings() {
    const settingsData = await LocalStorage.getAll('settings');
    const config = settingsData.find(s => s.id === 'app_settings');
    
    if (config) {
        return { ...APP_CONFIG.defaults, ...config };
    }
    
    // Créer les paramètres par défaut
    await LocalStorage.add('settings', {
        id: 'app_settings',
        ...APP_CONFIG.defaults
    });
    
    return APP_CONFIG.defaults;
}

// ===== INTERFACE =====
function buildAppInterface() {
    document.body.innerHTML = `
    <div class="app-container">
        ${buildSidebar()}
        ${buildMainContent()}
    </div>
    ${buildModal()}
    ${buildConfirmDialog()}
    <div class="toast-container" id="toastContainer"></div>`;
}

function buildSidebar() {
    return `
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="logo">
                <span class="logo-icon">${settings.logo || '🌴'}</span>
                <div class="logo-text">
                    <h1>${escapeHtml(settings.establishmentName || 'Le Paradisier')}</h1>
                    <span>Manager</span>
                </div>
            </div>
        </div>
        <nav class="sidebar-nav">
            <a href="#" class="nav-item active" data-module="dashboard">
                <i class="fas fa-th-large"></i><span>Tableau de bord</span>
            </a>
            <a href="#" class="nav-item" data-module="reservations">
                <i class="fas fa-calendar-check"></i><span>Réservations</span>
            </a>
            <a href="#" class="nav-item" data-module="rooms">
                <i class="fas fa-bed"></i><span>Chambres & Apparts</span>
            </a>
            <a href="#" class="nav-item" data-module="restaurant">
                <i class="fas fa-utensils"></i><span>Restaurant</span>
            </a>
            <a href="#" class="nav-item" data-module="deliveries">
                <i class="fas fa-motorcycle"></i><span>Livraisons</span>
            </a>
            <a href="#" class="nav-item" data-module="clients">
                <i class="fas fa-users"></i><span>Clients</span>
            </a>
            <a href="#" class="nav-item" data-module="stock">
                <i class="fas fa-boxes-stacked"></i><span>Stock</span>
            </a>
            <a href="#" class="nav-item" data-module="expenses">
                <i class="fas fa-receipt"></i><span>Dépenses</span>
            </a>
            <a href="#" class="nav-item" data-module="accounting">
                <i class="fas fa-landmark"></i><span>Comptabilité</span>
            </a>
            <a href="#" class="nav-item" data-module="staff">
                <i class="fas fa-user-tie"></i><span>Personnel</span>
            </a>
            <a href="#" class="nav-item" data-module="invoices">
                <i class="fas fa-file-invoice"></i><span>Factures</span>
            </a>
            <a href="#" class="nav-item" data-module="backup">
                <i class="fas fa-cloud-arrow-down"></i><span>Sauvegarde</span>
            </a>
            <a href="#" class="nav-item" data-module="settings">
                <i class="fas fa-gear"></i><span>Paramètres</span>
            </a>
        </nav>
        <div class="sidebar-footer">
            <p>v${APP_CONFIG.version} • Hors-ligne</p>
        </div>
    </aside>`;
}

function buildMainContent() {
    return `
    <main class="main-content">
        <header class="top-bar">
            <button class="menu-toggle" id="menuToggle">
                <i class="fas fa-bars"></i>
            </button>
            <div class="top-bar-title">
                <h2 id="pageTitle">Tableau de bord</h2>
                <span class="today-date" id="todayDate"></span>
            </div>
            <div class="top-bar-actions">
                <button class="btn btn-sm btn-outline" id="installBtn" style="display:none" title="Installer l'application">
                    <i class="fas fa-download"></i> Installer
                </button>
                <button class="btn-icon" onclick="LocalAuth.logout()" title="Déconnexion">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </header>
        <div class="content-area" id="contentArea">
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin fa-3x"></i>
            </div>
        </div>
    </main>`;
}

function buildModal() {
    return `
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal" id="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Titre</h3>
                <button class="modal-close" id="modalClose">&times;</button>
            </div>
            <div class="modal-body" id="modalBody"></div>
        </div>
    </div>`;
}

function buildConfirmDialog() {
    return `
    <div class="modal-overlay" id="confirmOverlay">
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h3 id="confirmTitle">Confirmation</h3>
            </div>
            <div class="modal-body">
                <p id="confirmMessage"></p>
                <div class="btn-group" style="margin-top: 20px; justify-content: flex-end;">
                    <button class="btn btn-outline" id="confirmCancel">Annuler</button>
                    <button class="btn btn-danger" id="confirmOk">Supprimer</button>
                </div>
            </div>
        </div>
    </div>`;
}

function attachEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.module);
        });
    });
    
    // Menu mobile
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    
    // Modal
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') closeModal();
    });
    
    // Confirm dialog
    document.getElementById('confirmCancel')?.addEventListener('click', () => {
        document.getElementById('confirmOverlay').classList.remove('active');
    });
}

// ===== NAVIGATION =====
async function navigateTo(module) {
    currentModule = module;
    
    // Mettre à jour la navigation active
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.module === module);
    });
    
    // Mettre à jour le titre
    const titles = {
        dashboard: 'Tableau de bord',
        reservations: 'Réservations',
        rooms: 'Chambres & Appartements',
        restaurant: 'Restaurant',
        deliveries: 'Livraisons',
        clients: 'Clients',
        stock: 'Stock',
        expenses: 'Dépenses',
        accounting: 'Comptabilité',
        staff: 'Personnel',
        invoices: 'Factures',
        backup: 'Sauvegarde & Restauration',
        settings: 'Paramètres'
    };
    
    document.getElementById('pageTitle').textContent = titles[module] || module;
    document.getElementById('sidebar').classList.remove('open');
    
    // Détruire les graphiques existants
    Object.values(charts).forEach(c => c?.destroy?.());
    charts = {};
    
    // Charger le module
    const content = document.getElementById('contentArea');
    content.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin fa-3x"></i></div>';
    
    try {
        await renderModule(module);
    } catch (error) {
        console.error('Erreur module:', error);
        content.innerHTML = `<div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Erreur: ${error.message}</p>
        </div>`;
    }
}

async function renderModule(module) {
    const content = document.getElementById('contentArea');
    
    switch (module) {
        case 'dashboard':
            await renderDashboard(content);
            break;
        case 'clients':
            await renderClients(content);
            break;
        case 'rooms':
            await renderRooms(content);
            break;
        case 'reservations':
            await renderReservations(content);
            break;
        case 'restaurant':
            await renderRestaurant(content);
            break;
        case 'deliveries':
            await renderDeliveries(content);
            break;
        case 'stock':
            await renderStock(content);
            break;
        case 'expenses':
            await renderExpenses(content);
            break;
        case 'accounting':
            await renderAccounting(content);
            break;
        case 'staff':
            await renderStaff(content);
            break;
        case 'invoices':
            await renderInvoices(content);
            break;
        case 'backup':
            await renderBackup(content);
            break;
        case 'settings':
            await renderSettings(content);
            break;
        default:
            content.innerHTML = '<div class="empty-state"><i class="fas fa-construction"></i><p>Module en développement</p></div>';
    }
}

// ===== UTILITAIRES =====
function formatMoney(amount) {
    return new Intl.NumberFormat('fr-MG').format(amount || 0) + ' ' + (settings.currency || 'Ar');
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
}

function formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function today() {
    return new Date().toISOString().split('T')[0];
}

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function updateDate() {
    const el = document.getElementById('todayDate');
    if (el) {
        el.textContent = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${escapeHtml(message)}`;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3500);
}

function openModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// Confirmation avant suppression
function confirmDelete(title, message) {
    return new Promise((resolve) => {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmOverlay').classList.add('active');
        
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');
        
        const cleanup = () => {
            document.getElementById('confirmOverlay').classList.remove('active');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
        };
        
        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };
        
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// Fonction pour sauvegarder avant suppression (undo)
function saveForUndo(type, data) {
    undoStack.push({ type, data, timestamp: Date.now() });
    if (undoStack.length > 10) undoStack.shift(); // Garder 10 max
}

// ===== PWA INSTALL =====
let deferredPrompt;

function checkPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installBtn').style.display = 'inline-flex';
    });
    
    document.getElementById('installBtn')?.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                showToast('Application installée !');
            }
            deferredPrompt = null;
            document.getElementById('installBtn').style.display = 'none';
        }
    });
}

// Export global
window.APP_CONFIG = APP_CONFIG;
window.settings = settings;
window.navigateTo = navigateTo;
window.formatMoney = formatMoney;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.today = today;
window.daysAgo = daysAgo;
window.escapeHtml = escapeHtml;
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.confirmDelete = confirmDelete;
window.saveForUndo = saveForUndo;
