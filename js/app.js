// ===========================================
// LE PARADISIER MANAGER - Application Principale
// Version avec API Backend
// ===========================================

// ===== CONFIGURATION =====
const APP_CONFIG = {
  name: 'Le Paradisier Manager',
  currency: 'Ar',
  apiURL: 'http://localhost:3000/api' // Modifier pour production
};

// ===== ÉTAT DE L'APPLICATION =====
let currentModule = 'dashboard';
let charts = {};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', async () => {
  // Configurer l'URL de l'API
  API.setBaseURL(APP_CONFIG.apiURL);
  
  // Vérifier l'authentification
  await initAuth();
});

async function initAuth() {
  // Essayer de charger depuis la session
  if (API.isAuthenticated() && AuthManager.loadFromSession()) {
    // Vérifier que le token est encore valide
    const valid = await AuthManager.verifyToken();
    if (valid) {
      initApp();
      return;
    }
  }
  
  // Afficher l'écran de connexion
  showLoginScreen();
}

function showLoginScreen() {
  document.body.innerHTML = renderLoginScreen();
  
  // Attacher les événements
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

function renderLoginScreen() {
  return `
    <div class="login-container">
      <div class="login-box">
        <div class="login-header">
          <span class="login-logo">🌴</span>
          <h1>Le Paradisier</h1>
          <p>Manager - Connexion sécurisée</p>
        </div>
        <form id="loginForm">
          <div class="login-form-group">
            <label for="email"><i class="fas fa-envelope"></i> Email</label>
            <input type="email" id="email" name="email" class="login-input" 
                   required autocomplete="email" placeholder="votre@email.mg">
          </div>
          <div class="login-form-group">
            <label for="password"><i class="fas fa-lock"></i> Mot de passe</label>
            <input type="password" id="password" name="password" class="login-input" 
                   required autocomplete="current-password" placeholder="Votre mot de passe">
          </div>
          <div id="loginError" class="login-error" style="display:none"></div>
          <button type="submit" class="login-btn" id="loginBtn">
            <i class="fas fa-sign-in-alt"></i> Se connecter
          </button>
        </form>
        <div class="login-footer">
          <p><i class="fas fa-shield-alt"></i> Connexion sécurisée via API</p>
          <small>Contactez l'administrateur si vous n'avez pas de compte</small>
        </div>
      </div>
    </div>`;
}



async function handleLogin(e) {
  e.preventDefault();
  
  const btn = document.getElementById('loginBtn');
  const errorDiv = document.getElementById('loginError');
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
  errorDiv.style.display = 'none';
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  const result = await AuthManager.login(email, password);
  
  if (result.success) {
    window.location.reload();
  } else {
    errorDiv.textContent = result.message;
    errorDiv.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
  }
}

// ===== INITIALISATION DE L'APP =====
function initApp() {
  // Reconstruire l'interface
  buildAppInterface();
  
  // Attacher les événements
  attachEventListeners();
  
  // Afficher la date
  updateDate();
  
  // Naviguer au dashboard
  navigateTo('dashboard');
}

function buildAppInterface() {
  // Récupérer le HTML original et reconstruire
  document.body.innerHTML = `
    <div class="app-container">
      ${buildSidebar()}
      ${buildMainContent()}
    </div>
    ${buildModal()}
    <div class="toast-container" id="toastContainer"></div>`;
}

function buildSidebar() {
  const user = AuthManager.currentUser;
  const modules = getAvailableModules();
  
  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🌴</span>
          <div class="logo-text">
            <h1>Le Paradisier</h1>
            <span>Manager</span>
          </div>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${modules.map(m => `
          <a href="#" class="nav-item" data-module="${m.id}">
            <i class="fas fa-${m.icon}"></i><span>${m.label}</span>
          </a>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <p>© 2024 Le Paradisier</p>
      </div>
    </aside>`;
}



function buildMainContent() {
  const user = AuthManager.currentUser;
  
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
          <div class="user-menu" id="userMenu">
            <div class="user-avatar">${AuthManager.getInitials(user?.name)}</div>
            <div class="user-info">
              <span class="user-name">${escapeHtml(user?.name || 'Utilisateur')}</span>
              <span class="user-role">${AuthManager.getRoleLabel(user?.role)}</span>
            </div>
            <button class="logout-btn" onclick="AuthManager.logout()" title="Déconnexion">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </header>
      <div class="content-area" id="contentArea">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin fa-3x"></i>
          <p>Chargement...</p>
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

function getAvailableModules() {
  const allModules = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'th-large' },
    { id: 'reservations', label: 'Réservations', icon: 'calendar-check' },
    { id: 'rooms', label: 'Chambres & Apparts', icon: 'bed' },
    { id: 'restaurant', label: 'Restaurant', icon: 'utensils' },
    { id: 'deliveries', label: 'Livraisons', icon: 'motorcycle' },
    { id: 'clients', label: 'Clients', icon: 'users' },
    { id: 'stock', label: 'Stock', icon: 'boxes-stacked' },
    { id: 'expenses', label: 'Dépenses', icon: 'receipt' },
    { id: 'invoices', label: 'Factures', icon: 'file-invoice' },
    { id: 'reports', label: 'Rapports', icon: 'chart-line' },
    { id: 'settings', label: 'Paramètres', icon: 'gear' }
  ];
  
  return allModules.filter(m => AuthManager.canAccessModule(m.id));
}

function attachEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.module);
    });
  });
  
  // Menu toggle mobile
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  
  // Fermer modal
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });
}



// ===== NAVIGATION =====
async function navigateTo(module) {
  // Vérifier les permissions
  if (!AuthManager.canAccessModule(module)) {
    showToast('Accès non autorisé', 'error');
    return;
  }
  
  currentModule = module;
  
  // Mettre à jour la navigation
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
    invoices: 'Factures',
    reports: 'Rapports',
    settings: 'Paramètres'
  };
  
  document.getElementById('pageTitle').textContent = titles[module] || module;
  
  // Fermer le sidebar sur mobile
  document.getElementById('sidebar').classList.remove('open');
  
  // Afficher le chargement
  const content = document.getElementById('contentArea');
  content.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin fa-3x"></i></div>';
  
  // Charger le module
  try {
    await renderModule(module);
  } catch (error) {
    console.error('Erreur chargement module:', error);
    content.innerHTML = `<div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>Erreur de chargement: ${error.message}</p>
      <button class="btn btn-primary" onclick="navigateTo('${module}')">Réessayer</button>
    </div>`;
  }
}

async function renderModule(module) {
  const content = document.getElementById('contentArea');
  
  // Détruire les graphiques existants
  Object.values(charts).forEach(c => c?.destroy?.());
  charts = {};
  
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
    case 'stock':
      await renderStock(content);
      break;
    case 'expenses':
      await renderExpenses(content);
      break;
    case 'invoices':
      await renderInvoices(content);
      break;
    default:
      content.innerHTML = '<div class="empty-state"><i class="fas fa-construction"></i><p>Module en développement</p></div>';
  }
}

// ===== UTILITAIRES =====
function formatMoney(amount) {
  return new Intl.NumberFormat('fr-MG').format(amount || 0) + ' Ar';
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



// ===== DASHBOARD =====
async function renderDashboard(container) {
  try {
    const stats = await API.dashboard.stats();
    const data = stats.data;
    
    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card kpi-ca-card">
          <div class="kpi-icon gold"><i class="fas fa-cash-register"></i></div>
          <div class="kpi-info">
            <div class="label">Revenus du jour</div>
            <div class="value">${formatMoney(data.today.revenue)}</div>
            <div class="ca-breakdown">
              <span class="ca-tag green"><i class="fas fa-utensils"></i> ${formatMoney(data.today.revenueRestaurant)}</span>
              <span class="ca-tag blue"><i class="fas fa-bed"></i> ${formatMoney(data.today.revenueRooms)}</span>
            </div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon red"><i class="fas fa-arrow-down"></i></div>
          <div class="kpi-info">
            <div class="label">Dépenses du jour</div>
            <div class="value">${formatMoney(data.today.expenses)}</div>
            <div class="trend down"><i class="fas fa-receipt"></i> ${data.today.expensesCount} dépense(s)</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon gold"><i class="fas fa-coins"></i></div>
          <div class="kpi-info">
            <div class="label">Bénéfice net</div>
            <div class="value">${formatMoney(data.today.profit)}</div>
            <div class="trend ${data.today.profit >= 0 ? 'up' : 'down'}">
              <i class="fas fa-${data.today.profit >= 0 ? 'arrow-up' : 'arrow-down'}"></i> 
              ${data.today.profit >= 0 ? 'Positif' : 'Négatif'}
            </div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon blue"><i class="fas fa-calendar-check"></i></div>
          <div class="kpi-info">
            <div class="label">Réservations actives</div>
            <div class="value">${data.reservations.active}</div>
            <div class="trend up"><i class="fas fa-bed"></i> En cours</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green"><i class="fas fa-utensils"></i></div>
          <div class="kpi-info">
            <div class="label">Commandes du jour</div>
            <div class="value">${data.today.ordersCount}</div>
            <div class="trend up"><i class="fas fa-fire"></i> ${formatMoney(data.today.ordersTotal)}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon blue"><i class="fas fa-chart-pie"></i></div>
          <div class="kpi-info">
            <div class="label">Taux d'occupation</div>
            <div class="value">${data.rooms.occupancyRate}%</div>
            <div class="trend ${data.rooms.occupancyRate > 50 ? 'up' : 'down'}">
              <i class="fas fa-building"></i> ${data.rooms.occupied}/${data.rooms.total} unités
            </div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon orange"><i class="fas fa-clock"></i></div>
          <div class="kpi-info">
            <div class="label">Paiements en attente</div>
            <div class="value">${formatMoney(data.pending.total)}</div>
            <div class="trend down"><i class="fas fa-exclamation"></i> À encaisser</div>
          </div>
        </div>
      </div>
      
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3>📈 Évolution sur 7 jours</h3></div>
          <div class="card-body"><div class="chart-container"><canvas id="chartRevenue"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><h3>⚠️ Alertes</h3></div>
          <div class="card-body">
            ${data.alerts.stockCount > 0 ? `<div class="alert-item danger"><i class="fas fa-exclamation-triangle"></i> ${data.alerts.stockCount} article(s) en stock critique</div>` : ''}
            ${data.pending.total > 0 ? `<div class="alert-item warning"><i class="fas fa-clock"></i> ${formatMoney(data.pending.total)} en attente d'encaissement</div>` : ''}
            ${data.alerts.stockCount === 0 && data.pending.total === 0 ? '<div class="alert-item info"><i class="fas fa-check"></i> Aucune alerte</div>' : ''}
          </div>
        </div>
      </div>`;
    
    // Charger les données du graphique
    await initDashboardChart();
    
  } catch (error) {
    container.innerHTML = `<div class="error-message">Erreur: ${error.message}</div>`;
  }
}

async function initDashboardChart() {
  try {
    const revenue = await API.dashboard.revenue('week');
    const data = revenue.data.values;
    
    const ctx = document.getElementById('chartRevenue')?.getContext('2d');
    if (!ctx) return;
    
    charts.revenue = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Restaurant',
            data: data.map(d => d.restaurant),
            borderColor: '#12A150',
            backgroundColor: 'rgba(18, 161, 80, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Hébergement',
            data: data.map(d => d.rooms),
            borderColor: '#0F3D3A',
            backgroundColor: 'rgba(15, 61, 58, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => (v/1000) + 'k' } }
        }
      }
    });
  } catch (e) {
    console.error('Erreur graphique:', e);
  }
}



// ===== CLIENTS =====
async function renderClients(container) {
  const result = await API.clients.list();
  const clients = result.data || [];
  const canCreate = AuthManager.hasPermission('clients', 'create');
  const canUpdate = AuthManager.hasPermission('clients', 'update');
  const canDelete = AuthManager.hasPermission('clients', 'delete');
  
  container.innerHTML = `
    <div class="module-header">
      <h3>${clients.length} client(s)</h3>
      ${canCreate ? '<button class="btn btn-primary" onclick="showClientForm()"><i class="fas fa-plus"></i> Nouveau client</button>' : ''}
    </div>
    <div class="card">
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Total dépensé</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${clients.map(c => `
                <tr>
                  <td><strong>${escapeHtml(c.name)}</strong></td>
                  <td>${escapeHtml(c.phone || '-')}</td>
                  <td>${escapeHtml(c.type)}</td>
                  <td><span class="status ${c.status === 'VIP' ? 'gold' : c.status === 'Fidèle' ? 'green' : 'blue'}">${c.status}</span></td>
                  <td>${formatMoney(c.total_spent)}</td>
                  <td class="actions-cell">
                    ${canUpdate ? `<button class="action-btn edit" onclick="showClientForm('${c.id}')" title="Modifier"><i class="fas fa-pen"></i></button>` : ''}
                    ${canDelete ? `<button class="action-btn delete" onclick="deleteClient('${c.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>` : ''}
                  </td>
                </tr>
              `).join('')}
              ${clients.length === 0 ? '<tr><td colspan="6" class="empty-state">Aucun client</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

async function showClientForm(id = null) {
  let client = { name: '', phone: '', email: '', type: 'Les deux', status: 'Nouveau', notes: '' };
  
  if (id) {
    const result = await API.clients.get(id);
    client = result.data;
  }
  
  openModal(id ? 'Modifier le client' : 'Nouveau client', `
    <form id="clientForm" onsubmit="saveClient(event, '${id || ''}')">
      <div class="form-group">
        <label>Nom *</label>
        <input type="text" class="form-control" name="name" value="${escapeHtml(client.name)}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Téléphone</label>
          <input type="text" class="form-control" name="phone" value="${escapeHtml(client.phone || '')}" placeholder="+261 34 XX XXX XX">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="form-control" name="email" value="${escapeHtml(client.email || '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Type</label>
          <select class="form-control" name="type">
            <option value="Restaurant" ${client.type === 'Restaurant' ? 'selected' : ''}>Restaurant</option>
            <option value="Appartement" ${client.type === 'Appartement' ? 'selected' : ''}>Appartement</option>
            <option value="Les deux" ${client.type === 'Les deux' ? 'selected' : ''}>Les deux</option>
          </select>
        </div>
        <div class="form-group">
          <label>Statut</label>
          <select class="form-control" name="status">
            <option value="Nouveau" ${client.status === 'Nouveau' ? 'selected' : ''}>Nouveau</option>
            <option value="Fidèle" ${client.status === 'Fidèle' ? 'selected' : ''}>Fidèle</option>
            <option value="VIP" ${client.status === 'VIP' ? 'selected' : ''}>VIP</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea class="form-control" name="notes">${escapeHtml(client.notes || '')}</textarea>
      </div>
      <div class="btn-group">
        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
        <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
      </div>
    </form>
  `);
}

async function saveClient(e, id) {
  e.preventDefault();
  const form = new FormData(e.target);
  const data = Object.fromEntries(form);
  
  try {
    if (id) {
      await API.clients.update(id, data);
      showToast('Client modifié');
    } else {
      await API.clients.create(data);
      showToast('Client créé');
    }
    closeModal();
    navigateTo('clients');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteClient(id) {
  if (!confirm('Supprimer ce client ?')) return;
  try {
    await API.clients.delete(id);
    showToast('Client supprimé');
    navigateTo('clients');
  } catch (error) {
    showToast(error.message, 'error');
  }
}



// ===== ROOMS =====
async function renderRooms(container) {
  const result = await API.rooms.list();
  const rooms = result.data || [];
  const canCreate = AuthManager.hasPermission('rooms', 'create');
  
  container.innerHTML = `
    <div class="module-header">
      <h3>${rooms.length} chambre(s) / appartement(s)</h3>
      ${canCreate ? '<button class="btn btn-primary" onclick="showRoomForm()"><i class="fas fa-plus"></i> Ajouter</button>' : ''}
    </div>
    <div class="rooms-grid">
      ${rooms.map(r => `
        <div class="room-card">
          <div class="room-name">${escapeHtml(r.name)}</div>
          <div class="room-type">${escapeHtml(r.type)} • ${r.capacity} pers.</div>
          <div class="room-price">${formatMoney(r.price_per_night)}/nuit</div>
          <span class="status ${r.status === 'Disponible' ? 'green' : r.status === 'Occupé' ? 'red' : 'orange'}">${r.status}</span>
        </div>
      `).join('')}
    </div>`;
}

// ===== RESERVATIONS =====
async function renderReservations(container) {
  const result = await API.reservations.list();
  const reservations = result.data || [];
  const canCreate = AuthManager.hasPermission('reservations', 'create');
  
  container.innerHTML = `
    <div class="module-header">
      <h3>${reservations.length} réservation(s)</h3>
      ${canCreate ? '<button class="btn btn-primary" onclick="showReservationForm()"><i class="fas fa-plus"></i> Nouvelle</button>' : ''}
    </div>
    <div class="card"><div class="card-body">
      <div class="table-container">
        <table>
          <thead><tr><th>N°</th><th>Client</th><th>Chambre</th><th>Dates</th><th>Total</th><th>Statut</th></tr></thead>
          <tbody>
            ${reservations.map(r => `
              <tr>
                <td>${escapeHtml(r.reservation_number)}</td>
                <td>${escapeHtml(r.client_name || '-')}</td>
                <td>${escapeHtml(r.room_name || '-')}</td>
                <td>${formatDate(r.check_in)} → ${formatDate(r.check_out)}</td>
                <td>${formatMoney(r.total_amount)}</td>
                <td><span class="status ${r.status === 'Confirmée' ? 'green' : r.status === 'Annulée' ? 'red' : 'orange'}">${r.status}</span></td>
              </tr>
            `).join('')}
            ${reservations.length === 0 ? '<tr><td colspan="6" class="empty-state">Aucune réservation</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div></div>`;
}

// ===== RESTAURANT =====
async function renderRestaurant(container) {
  const result = await API.restaurant.today();
  const orders = result.data || [];
  const canCreate = AuthManager.hasPermission('restaurant', 'create');
  
  container.innerHTML = `
    <div class="module-header">
      <h3>${orders.length} commande(s) aujourd'hui</h3>
      ${canCreate ? '<button class="btn btn-primary" onclick="showOrderForm()"><i class="fas fa-plus"></i> Nouvelle commande</button>' : ''}
    </div>
    <div class="card"><div class="card-body">
      <div class="table-container">
        <table>
          <thead><tr><th>N°</th><th>Client</th><th>Items</th><th>Type</th><th>Total</th><th>Statut</th></tr></thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td>${escapeHtml(o.order_number)}</td>
                <td>${escapeHtml(o.client_name || o.client_phone || 'Client passage')}</td>
                <td>${escapeHtml((o.items_text || '').substring(0, 30))}...</td>
                <td>${escapeHtml(o.order_type)}</td>
                <td>${formatMoney(o.total_amount)}</td>
                <td><span class="status ${o.status === 'Livrée' ? 'green' : o.status === 'Annulée' ? 'red' : 'orange'}">${o.status}</span></td>
              </tr>
            `).join('')}
            ${orders.length === 0 ? '<tr><td colspan="6" class="empty-state">Aucune commande</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div></div>`;
}



// ===== STOCK =====
async function renderStock(container) {
  const result = await API.stock.list();
  const items = result.data || [];
  const canCreate = AuthManager.hasPermission('stock', 'create');
  
  container.innerHTML = `
    <div class="module-header">
      <h3>${items.length} article(s) en stock</h3>
      ${canCreate ? '<button class="btn btn-primary" onclick="showStockForm()"><i class="fas fa-plus"></i> Ajouter</button>' : ''}
    </div>
    <div class="card"><div class="card-body">
      <div class="table-container">
        <table>
          <thead><tr><th>Article</th><th>Catégorie</th><th>Quantité</th><th>Seuil</th><th>Prix achat</th><th>Statut</th></tr></thead>
          <tbody>
            ${items.map(s => `
              <tr>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td>${escapeHtml(s.category)}</td>
                <td>${s.quantity} ${s.unit}</td>
                <td>${s.min_quantity}</td>
                <td>${formatMoney(s.purchase_price)}</td>
                <td><span class="status ${s.status === 'OK' ? 'green' : s.status === 'Critique' || s.status === 'Épuisé' ? 'red' : 'orange'}">${s.status}</span></td>
              </tr>
            `).join('')}
            ${items.length === 0 ? '<tr><td colspan="6" class="empty-state">Aucun article</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div></div>`;
}

// ===== EXPENSES =====
async function renderExpenses(container) {
  const result = await API.expenses.list();
  const expenses = result.data || [];
  const canCreate = AuthManager.hasPermission('expenses', 'create');
  const total = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  
  container.innerHTML = `
    <div class="module-header">
      <h3>${expenses.length} dépense(s) • Total: ${formatMoney(total)}</h3>
      ${canCreate ? '<button class="btn btn-primary" onclick="showExpenseForm()"><i class="fas fa-plus"></i> Ajouter</button>' : ''}
    </div>
    <div class="card"><div class="card-body">
      <div class="table-container">
        <table>
          <thead><tr><th>Date</th><th>Catégorie</th><th>Description</th><th>Montant</th><th>Paiement</th></tr></thead>
          <tbody>
            ${expenses.map(e => `
              <tr>
                <td>${formatDate(e.date)}</td>
                <td>${escapeHtml(e.category)}</td>
                <td>${escapeHtml(e.description)}</td>
                <td><strong>${formatMoney(e.amount)}</strong></td>
                <td>${escapeHtml(e.payment_method || '-')}</td>
              </tr>
            `).join('')}
            ${expenses.length === 0 ? '<tr><td colspan="5" class="empty-state">Aucune dépense</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div></div>`;
}

// ===== INVOICES =====
async function renderInvoices(container) {
  const result = await API.invoices.list();
  const invoices = result.data || [];
  const canCreate = AuthManager.hasPermission('invoices', 'create');
  
  container.innerHTML = `
    <div class="module-header">
      <h3>${invoices.length} facture(s)</h3>
      ${canCreate ? '<button class="btn btn-primary" onclick="showInvoiceForm()"><i class="fas fa-plus"></i> Nouvelle facture</button>' : ''}
    </div>
    <div class="card"><div class="card-body">
      <div class="table-container">
        <table>
          <thead><tr><th>N°</th><th>Client</th><th>Service</th><th>Total</th><th>Payé</th><th>Statut</th></tr></thead>
          <tbody>
            ${invoices.map(i => `
              <tr>
                <td>${escapeHtml(i.invoice_number)}</td>
                <td>${escapeHtml(i.client_name || '-')}</td>
                <td>${escapeHtml(i.service_type || '-')}</td>
                <td>${formatMoney(i.total_amount)}</td>
                <td>${formatMoney(i.paid_amount)}</td>
                <td><span class="status ${i.status === 'Payée' ? 'green' : i.status === 'Annulée' ? 'red' : 'orange'}">${i.status}</span></td>
              </tr>
            `).join('')}
            ${invoices.length === 0 ? '<tr><td colspan="6" class="empty-state">Aucune facture</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div></div>`;
}
