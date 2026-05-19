/* ============================================
   LE PARADISIER MANAGER - Application Logic
   ============================================ */

// ===== APP STATE & CONFIG =====
const APP = {
    name: 'Le Paradisier Manager',
    currency: 'Ar',
    phone: '+261 34 00 000 00',
    address: 'Toamasina, Madagascar'
};

// ===== UTILITY FUNCTIONS =====
function generateId(prefix) {
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
}

function formatMoney(amount) {
    const settings = getData('settings') || {};
    const currency = settings.currency || APP.currency;
    return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' ' + currency;
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

// ===== LOCAL STORAGE =====
function getData(key) {
    try {
        const data = localStorage.getItem('paradisier_' + key);
        return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
}

function setData(key, value) {
    try {
        localStorage.setItem('paradisier_' + key, JSON.stringify(value));
    } catch (e) { console.error('Storage error:', e); }
}

function getAllData() {
    const keys = ['reservations', 'rooms', 'orders', 'deliveries', 'clients', 'stock', 'expenses', 'staff', 'settings'];
    const data = {};
    keys.forEach(k => { data[k] = getData(k) || []; });
    return data;
}

// ===== DEMO DATA =====
function loadDemoData() {
    if (getData('initialized')) return;

    const clients = [
        { id: generateId('CLT'), name: 'Rindra Rakotomalala', phone: '+261 34 12 345 67', email: 'rindra@email.com', type: 'Les deux', reservations: 3, orders: 8, totalSpent: 4850000, lastVisit: daysAgo(1), status: 'VIP', notes: 'Cliente fidèle' },
        { id: generateId('CLT'), name: 'Haja Andrianaivo', phone: '+261 32 98 765 43', email: 'haja.a@email.com', type: 'Restaurant', reservations: 0, orders: 12, totalSpent: 1560000, lastVisit: daysAgo(2), status: 'Fidèle', notes: '' },
        { id: generateId('CLT'), name: 'Volatiana Rasoamanana', phone: '+261 33 45 678 90', email: '', type: 'Appartement', reservations: 2, orders: 1, totalSpent: 3200000, lastVisit: daysAgo(5), status: 'Fidèle', notes: 'Préfère étage 2' },
        { id: generateId('CLT'), name: 'Niry Randriamahefa', phone: '+261 34 33 221 10', email: 'niry.r@email.com', type: 'Restaurant', reservations: 0, orders: 5, totalSpent: 675000, lastVisit: daysAgo(10), status: 'Nouveau', notes: '' },
        { id: generateId('CLT'), name: 'Zo Rabemananjara', phone: '+261 32 55 443 32', email: 'zo.r@email.com', type: 'Les deux', reservations: 4, orders: 6, totalSpent: 7200000, lastVisit: today(), status: 'VIP', notes: 'Entreprise - facture mensuelle' }
    ];

    const rooms = [
        { id: generateId('RM'), name: 'Appartement 1A', type: 'Appartement', capacity: 4, price: 450000, status: 'Occupé', floor: 'Étage 1', description: 'Grand appartement avec vue mer', equipment: ['WiFi', 'Climatisation', 'Cuisine', 'TV', 'Parking'] },
        { id: generateId('RM'), name: 'Appartement 2B', type: 'Appartement', capacity: 2, price: 350000, status: 'Disponible', floor: 'Étage 2', description: 'Appartement cosy', equipment: ['WiFi', 'Climatisation', 'Cuisine', 'TV'] },
        { id: generateId('RM'), name: 'Appartement 3C', type: 'Appartement', capacity: 3, price: 400000, status: 'Nettoyage', floor: 'Étage 3', description: 'Appartement familial', equipment: ['WiFi', 'Climatisation', 'Cuisine', 'TV', 'Parking'] },
        { id: generateId('RM'), name: 'Chambre Deluxe 01', type: 'Chambre', capacity: 2, price: 250000, status: 'Occupé', floor: 'Étage 1', description: 'Chambre deluxe avec balcon', equipment: ['WiFi', 'Climatisation', 'TV'] },
        { id: generateId('RM'), name: 'Chambre Standard 05', type: 'Chambre', capacity: 2, price: 150000, status: 'Disponible', floor: 'Étage 2', description: 'Chambre confortable', equipment: ['WiFi', 'Climatisation'] },
        { id: generateId('RM'), name: 'Chambre Deluxe 02', type: 'Chambre', capacity: 2, price: 250000, status: 'Maintenance', floor: 'Étage 1', description: 'En réparation climatisation', equipment: ['WiFi', 'Climatisation', 'TV'] }
    ];

    const reservations = [
        { id: 'RSV-001', client: 'Rindra Rakotomalala', phone: '+261 34 12 345 67', type: 'Appartement', unit: 'Appartement 1A', dateIn: today(), dateOut: daysAgo(-3), nights: 3, pricePerNight: 450000, total: 1350000, deposit: 1350000, remaining: 0, paymentStatus: 'Payé', status: 'Confirmée', note: '' },
        { id: 'RSV-002', client: 'Volatiana Rasoamanana', phone: '+261 33 45 678 90', type: 'Chambre', unit: 'Chambre Deluxe 01', dateIn: daysAgo(1), dateOut: daysAgo(-2), nights: 3, pricePerNight: 250000, total: 750000, deposit: 500000, remaining: 250000, paymentStatus: 'Acompte', status: 'Confirmée', note: 'Arrivée tardive' },
        { id: 'RSV-003', client: 'Zo Rabemananjara', phone: '+261 32 55 443 32', type: 'Appartement', unit: 'Appartement 2B', dateIn: daysAgo(-5), dateOut: daysAgo(-8), nights: 3, pricePerNight: 350000, total: 1050000, deposit: 0, remaining: 1050000, paymentStatus: 'En attente', status: 'En attente', note: 'Confirmation en cours' }
    ];

    const orders = [
        { id: 'CMD-001', time: today() + 'T12:30', client: 'Haja Andrianaivo', phone: '+261 32 98 765 43', type: 'Sur place', items: 'Romazava, Vary (riz), Jus de goyave', amount: 85000, payment: 'Espèces', paymentStatus: 'Payé', status: 'Livrée', note: '' },
        { id: 'CMD-002', time: today() + 'T13:00', client: 'Niry Randriamahefa', phone: '+261 34 33 221 10', type: 'À emporter', items: 'Poisson grillé, Mofo gasy, Boisson', amount: 120000, payment: 'MVola', paymentStatus: 'Payé', status: 'Prête', note: '' },
        { id: 'CMD-003', time: today() + 'T13:45', client: 'Rindra Rakotomalala', phone: '+261 34 12 345 67', type: 'Livraison', items: 'Crevettes sautées, Vary x2, Litchis', amount: 220000, payment: 'Non payé', paymentStatus: 'En attente', status: 'En préparation', note: 'Livreur à affecter' },
        { id: 'CMD-004', time: today() + 'T11:00', client: 'Zo Rabemananjara', phone: '+261 32 55 443 32', type: 'Sur place', items: 'Salade de palmier, Eau minérale', amount: 65000, payment: 'Carte', paymentStatus: 'Payé', status: 'Livrée', note: '' },
        { id: 'CMD-005', time: today() + 'T14:15', client: 'Client passage', phone: '', type: 'Sur place', items: 'Brochettes zébu x4, Frites, Jus de tamarin', amount: 150000, payment: 'Espèces', paymentStatus: 'Payé', status: 'À préparer', note: '' }
    ];

    const deliveries = [
        { id: generateId('LIV'), client: 'Rindra Rakotomalala', phone: '+261 34 12 345 67', address: 'Anjoma, Toamasina', order: 'CMD-003', driver: 'Tsiry Rakoto', deliveryFee: 15000, total: 235000, departure: '14:00', eta: '14:30', status: 'En route', payment: 'À encaisser', note: '' },
        { id: generateId('LIV'), client: 'Client Express', phone: '+261 32 11 223 34', address: 'Bazarikely, Toamasina', order: 'CMD-006', driver: 'Faniry Andria', deliveryFee: 20000, total: 180000, departure: '12:30', eta: '13:00', status: 'Livrée', payment: 'Payé', note: '' }
    ];

    const stock = [
        { id: generateId('STK'), product: 'Poulet fermier', category: 'Cuisine', quantity: 8, unit: 'kg', threshold: 5, buyPrice: 35000, value: 280000, supplier: 'Marché Bazarikely', lastEntry: daysAgo(1), status: 'OK' },
        { id: generateId('STK'), product: 'Tomates', category: 'Cuisine', quantity: 3, unit: 'kg', threshold: 5, buyPrice: 12000, value: 36000, supplier: 'Marché Bazarikely', lastEntry: daysAgo(2), status: 'Faible' },
        { id: generateId('STK'), product: 'Vary (riz) 5kg', category: 'Cuisine', quantity: 12, unit: 'paquet', threshold: 4, buyPrice: 40000, value: 480000, supplier: 'Grossiste Riz Tamatave', lastEntry: daysAgo(3), status: 'OK' },
        { id: generateId('STK'), product: 'Huile végétale', category: 'Cuisine', quantity: 6, unit: 'L', threshold: 3, buyPrice: 18000, value: 108000, supplier: 'Grossiste Tamatave', lastEntry: daysAgo(5), status: 'OK' },
        { id: generateId('STK'), product: 'Jus de goyave', category: 'Boissons', quantity: 2, unit: 'paquet', threshold: 5, buyPrice: 60000, value: 120000, supplier: 'Distributeur Boissons', lastEntry: daysAgo(7), status: 'Critique' },
        { id: generateId('STK'), product: 'Crevettes fraîches', category: 'Cuisine', quantity: 4, unit: 'kg', threshold: 3, buyPrice: 120000, value: 480000, supplier: 'Pêcheur du port', lastEntry: daysAgo(1), status: 'OK' },
        { id: generateId('STK'), product: 'Produits nettoyage', category: 'Nettoyage', quantity: 10, unit: 'pièce', threshold: 4, buyPrice: 20000, value: 200000, supplier: 'Quincaillerie', lastEntry: daysAgo(10), status: 'OK' },
        { id: generateId('STK'), product: 'Draps', category: 'Chambre', quantity: 1, unit: 'pièce', threshold: 6, buyPrice: 150000, value: 150000, supplier: 'Fournisseur Textile', lastEntry: daysAgo(15), status: 'Critique' },
        { id: generateId('STK'), product: 'Savon invité', category: 'Chambre', quantity: 20, unit: 'pièce', threshold: 10, buyPrice: 5000, value: 100000, supplier: 'Grossiste Hygiène', lastEntry: daysAgo(4), status: 'OK' }
    ];

    const expenses = [
        { id: generateId('DEP'), date: today(), description: 'Achat produits alimentaires', category: 'Achats restaurant', supplier: 'Marché Bazarikely', amount: 450000, payment: 'Espèces', reference: '', note: '' },
        { id: generateId('DEP'), date: daysAgo(1), description: 'Salaire personnel (acompte)', category: 'Salaires', supplier: 'Personnel', amount: 1500000, payment: 'MVola', reference: 'SAL-202401', note: 'Acompte mi-mois' },
        { id: generateId('DEP'), date: daysAgo(2), description: 'Facture électricité JIRAMA', category: 'Électricité', supplier: 'JIRAMA', amount: 850000, payment: 'MVola', reference: 'ELEC-2024', note: '' },
        { id: generateId('DEP'), date: daysAgo(3), description: 'Maintenance climatisation', category: 'Maintenance', supplier: 'Techni-Froid Tana', amount: 350000, payment: 'Espèces', reference: '', note: 'Chambre Deluxe 02' },
        { id: generateId('DEP'), date: daysAgo(4), description: 'Achat boissons', category: 'Achats restaurant', supplier: 'Distributeur', amount: 620000, payment: 'Espèces', reference: '', note: '' },
        { id: generateId('DEP'), date: daysAgo(5), description: 'Facture Internet', category: 'Internet', supplier: 'Telma', amount: 250000, payment: 'MVola', reference: '', note: '' }
    ];

    const staff = [
        { id: generateId('STF'), name: 'Tsiry Rakoto', position: 'Livreur', phone: '+261 34 11 223 34', status: 'Présent', shift: 'Matin/Soir', tasks: 'Livraisons du jour', note: '' },
        { id: generateId('STF'), name: 'Sahondra Razafindrakoto', position: 'Cuisine', phone: '+261 32 22 334 45', status: 'Présent', shift: 'Matin', tasks: 'Préparation déjeuner', note: '' },
        { id: generateId('STF'), name: 'Faniry Andria', position: 'Livreur', phone: '+261 33 44 556 67', status: 'Présent', shift: 'Soir', tasks: 'Livraisons après-midi', note: '' },
        { id: generateId('STF'), name: 'Miora Rakotondrabe', position: 'Réception', phone: '+261 34 33 445 56', status: 'Présent', shift: 'Journée', tasks: 'Accueil clients, check-in/out', note: '' },
        { id: generateId('STF'), name: 'Henintsoa Andriamasy', position: 'Serveur', phone: '+261 32 55 667 78', status: 'Absent', shift: '-', tasks: '', note: 'Congé maladie' },
        { id: generateId('STF'), name: 'Lalaina Ranaivo', position: 'Ménage', phone: '+261 33 77 889 90', status: 'Présent', shift: 'Matin', tasks: 'Nettoyage Appart 3C, chambres étage 2', note: '' }
    ];

    setData('clients', clients);
    setData('rooms', rooms);
    setData('reservations', reservations);
    setData('orders', orders);
    setData('deliveries', deliveries);
    setData('stock', stock);
    setData('expenses', expenses);
    setData('staff', staff);
    setData('settings', { name: 'Le Paradisier', currency: 'Ar', phone: '+261 34 00 000 00', address: 'Toamasina, Madagascar' });
    setData('initialized', true);
}

// ===== TOAST & MODAL =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'}"></i> ${message}`;
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

// ===== NAVIGATION =====
let currentModule = 'dashboard';
let charts = {};

function navigateTo(module) {
    currentModule = module;
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.module === module);
    });
    const titles = {
        dashboard: 'Tableau de bord', reservations: 'Réservations', rooms: 'Chambres & Appartements',
        restaurant: 'Restaurant', deliveries: 'Livraisons', clients: 'Clients',
        stock: 'Stock', expenses: 'Dépenses', finances: 'Finances',
        staff: 'Personnel', revenue: 'Chiffre d\'affaires', invoices: 'Factures',
        reports: 'Rapports', settings: 'Paramètres'
    };
    document.getElementById('pageTitle').textContent = titles[module] || module;
    renderModule(module);
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
}

function renderModule(module) {
    // Destroy existing charts
    Object.values(charts).forEach(c => c.destroy && c.destroy());
    charts = {};

    const content = document.getElementById('contentArea');
    switch (module) {
        case 'dashboard': content.innerHTML = renderDashboard(); initDashboardCharts(); break;
        case 'reservations': content.innerHTML = renderReservations(); break;
        case 'rooms': content.innerHTML = renderRooms(); break;
        case 'restaurant': content.innerHTML = renderRestaurant(); break;
        case 'deliveries': content.innerHTML = renderDeliveries(); break;
        case 'clients': content.innerHTML = renderClients(); break;
        case 'stock': content.innerHTML = renderStock(); break;
        case 'expenses': content.innerHTML = renderExpenses(); break;
        case 'finances': content.innerHTML = renderFinances(); initFinanceCharts(); break;
        case 'staff': content.innerHTML = renderStaff(); break;
        case 'revenue': content.innerHTML = renderRevenue(); break;
        case 'invoices': content.innerHTML = renderInvoices(); break;
        case 'reports': content.innerHTML = renderReports(); break;
        case 'settings': content.innerHTML = renderSettings(); break;
    }
}

// ===== DASHBOARD =====
function renderDashboard() {
    const orders = getData('orders') || [];
    const reservations = getData('reservations') || [];
    const expenses = getData('expenses') || [];
    const rooms = getData('rooms') || [];
    const stock = getData('stock') || [];
    const staff = getData('staff') || [];

    const todayOrders = orders.filter(o => o.time && o.time.startsWith(today()));
    const todayExpenses = expenses.filter(e => e.date === today());
    const revenueToday = todayOrders.filter(o => o.paymentStatus === 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const expenseToday = todayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const profit = revenueToday - expenseToday;
    const todayRes = reservations.filter(r => r.dateIn === today() || r.status === 'Confirmée');
    const occupied = rooms.filter(r => r.status === 'Occupé').length;
    const totalRooms = rooms.length;
    const occupancy = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;
    const pendingPayments = reservations.filter(r => r.paymentStatus !== 'Payé').reduce((s, r) => s + (r.remaining || 0), 0)
        + orders.filter(o => o.paymentStatus !== 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const criticalStock = stock.filter(s => s.status === 'Critique');
    const presentStaff = staff.filter(s => s.status === 'Présent');

    return `
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-icon green"><i class="fas fa-arrow-up"></i></div>
            <div class="kpi-info">
                <div class="label">Revenus du jour</div>
                <div class="value">${formatMoney(revenueToday)}</div>
                <div class="trend up"><i class="fas fa-arrow-up"></i> Restaurant</div>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-icon red"><i class="fas fa-arrow-down"></i></div>
            <div class="kpi-info">
                <div class="label">Dépenses du jour</div>
                <div class="value">${formatMoney(expenseToday)}</div>
                <div class="trend down"><i class="fas fa-receipt"></i> ${todayExpenses.length} dépense(s)</div>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-icon gold"><i class="fas fa-coins"></i></div>
            <div class="kpi-info">
                <div class="label">Bénéfice net</div>
                <div class="value">${formatMoney(profit)}</div>
                <div class="trend ${profit >= 0 ? 'up' : 'down'}"><i class="fas fa-${profit >= 0 ? 'arrow-up' : 'arrow-down'}"></i> ${profit >= 0 ? 'Positif' : 'Négatif'}</div>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-icon blue"><i class="fas fa-calendar-check"></i></div>
            <div class="kpi-info">
                <div class="label">Réservations actives</div>
                <div class="value">${todayRes.length}</div>
                <div class="trend up"><i class="fas fa-bed"></i> En cours</div>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-icon green"><i class="fas fa-utensils"></i></div>
            <div class="kpi-info">
                <div class="label">Commandes restaurant</div>
                <div class="value">${todayOrders.length}</div>
                <div class="trend up"><i class="fas fa-fire"></i> Aujourd'hui</div>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-icon blue"><i class="fas fa-chart-pie"></i></div>
            <div class="kpi-info">
                <div class="label">Taux d'occupation</div>
                <div class="value">${occupancy}%</div>
                <div class="trend ${occupancy > 60 ? 'up' : 'down'}"><i class="fas fa-building"></i> ${occupied}/${totalRooms} unités</div>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-icon orange"><i class="fas fa-clock"></i></div>
            <div class="kpi-info">
                <div class="label">Paiements en attente</div>
                <div class="value">${formatMoney(pendingPayments)}</div>
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
            <div class="card-header"><h3>🏨 Occupation des unités</h3></div>
            <div class="card-body"><div class="chart-container"><canvas id="chartOccupancy"></canvas></div></div>
        </div>
    </div>

    <div class="grid-3">
        <div class="card">
            <div class="card-header"><h3>⚠️ Alertes</h3></div>
            <div class="card-body">
                ${criticalStock.length > 0 ? criticalStock.map(s => `<div class="alert-item danger"><i class="fas fa-exclamation-triangle"></i> Stock critique : ${s.product}</div>`).join('') : ''}
                ${pendingPayments > 0 ? `<div class="alert-item warning"><i class="fas fa-clock"></i> ${formatMoney(pendingPayments)} en attente d'encaissement</div>` : ''}
                ${rooms.filter(r => r.status === 'Maintenance').length > 0 ? `<div class="alert-item info"><i class="fas fa-tools"></i> ${rooms.filter(r => r.status === 'Maintenance').length} unité(s) en maintenance</div>` : ''}
                ${criticalStock.length === 0 && pendingPayments === 0 ? '<div class="alert-item info"><i class="fas fa-check"></i> Aucune alerte</div>' : ''}
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🍽️ Commandes récentes</h3></div>
            <div class="card-body">
                <ul class="widget-list">
                    ${todayOrders.slice(0, 5).map(o => `<li><span>${o.client} - ${o.items.substring(0, 25)}...</span><span class="status ${o.status === 'Livrée' ? 'green' : o.status === 'En préparation' ? 'orange' : 'blue'}">${o.status}</span></li>`).join('')}
                    ${todayOrders.length === 0 ? '<li>Aucune commande aujourd\'hui</li>' : ''}
                </ul>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>👥 Personnel présent</h3></div>
            <div class="card-body">
                <ul class="widget-list">
                    ${presentStaff.map(s => `<li><span><strong>${s.name}</strong> - ${s.position}</span><span class="status green">Présent</span></li>`).join('')}
                </ul>
            </div>
        </div>
    </div>`;
}

function initDashboardCharts() {
    // Revenue chart
    const ctx1 = document.getElementById('chartRevenue');
    if (ctx1) {
        const labels = [];
        const revenueData = [];
        const expenseData = [];
        for (let i = 6; i >= 0; i--) {
            const d = daysAgo(i);
            labels.push(new Date(d).toLocaleDateString('fr-FR', { weekday: 'short' }));
            const orders = (getData('orders') || []).filter(o => o.time && o.time.startsWith(d) && o.paymentStatus === 'Payé');
            revenueData.push(orders.reduce((s, o) => s + (o.amount || 0), 0) + Math.floor(Math.random() * 30000));
            const exp = (getData('expenses') || []).filter(e => e.date === d);
            expenseData.push(exp.reduce((s, e) => s + (e.amount || 0), 0) + Math.floor(Math.random() * 15000));
        }
        charts.revenue = new Chart(ctx1, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Revenus', data: revenueData, borderColor: '#12A150', backgroundColor: 'rgba(18,161,80,0.1)', fill: true, tension: 0.4 },
                    { label: 'Dépenses', data: expenseData, borderColor: '#E5484D', backgroundColor: 'rgba(229,72,77,0.1)', fill: true, tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
        });
    }

    // Occupancy chart
    const ctx2 = document.getElementById('chartOccupancy');
    if (ctx2) {
        const rooms = getData('rooms') || [];
        const statuses = ['Occupé', 'Disponible', 'Nettoyage', 'Maintenance'];
        const counts = statuses.map(s => rooms.filter(r => r.status === s).length);
        charts.occupancy = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: statuses,
                datasets: [{ data: counts, backgroundColor: ['#0F3D3A', '#12A150', '#F59E0B', '#E5484D'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

// ===== RESERVATIONS MODULE =====
function renderReservations() {
    const reservations = getData('reservations') || [];
    return `
    <div class="module-header">
        <h3>${reservations.length} réservation(s)</h3>
        <button class="btn btn-primary" onclick="openReservationForm()"><i class="fas fa-plus"></i> Nouvelle réservation</button>
    </div>
    <div class="filters-bar">
        <input type="text" class="search-input" placeholder="Rechercher client, tél, unité..." onkeyup="filterReservations(this.value)">
        <select class="filter-select" onchange="filterReservationsByStatus(this.value)">
            <option value="">Tous les statuts</option>
            <option value="Confirmée">Confirmée</option>
            <option value="En attente">En attente</option>
            <option value="Annulée">Annulée</option>
            <option value="Terminée">Terminée</option>
        </select>
    </div>
    <div class="card">
        <div class="table-container">
            <table id="reservationsTable">
                <thead>
                    <tr><th>ID</th><th>Client</th><th>Unité</th><th>Arrivée</th><th>Départ</th><th>Total</th><th>Paiement</th><th>Statut</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${reservations.map(r => `
                    <tr>
                        <td><strong>${r.id}</strong></td>
                        <td>${r.client}<br><small style="color:var(--text-gray)">${r.phone}</small></td>
                        <td>${r.unit}</td>
                        <td>${formatDate(r.dateIn)}</td>
                        <td>${formatDate(r.dateOut)}</td>
                        <td><strong>${formatMoney(r.total)}</strong></td>
                        <td><span class="status ${r.paymentStatus === 'Payé' ? 'green' : r.paymentStatus === 'Acompte' ? 'orange' : 'red'}">${r.paymentStatus}</span></td>
                        <td><span class="status ${r.status === 'Confirmée' ? 'green' : r.status === 'En attente' ? 'orange' : r.status === 'Annulée' ? 'red' : 'blue'}">${r.status}</span></td>
                        <td class="actions-cell">
                            <button class="action-btn edit" onclick="editReservation('${r.id}')" title="Modifier"><i class="fas fa-pen"></i></button>
                            <button class="action-btn delete" onclick="deleteReservation('${r.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
            ${reservations.length === 0 ? '<div class="empty-state"><i class="fas fa-calendar"></i><p>Aucune réservation</p></div>' : ''}
        </div>
    </div>`;
}

function openReservationForm(reservation = null) {
    const rooms = getData('rooms') || [];
    const r = reservation || {};
    openModal(reservation ? 'Modifier réservation' : 'Nouvelle réservation', `
        <form onsubmit="saveReservation(event, '${r.id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Client</label><input class="form-control" name="client" value="${r.client || ''}" required></div>
                <div class="form-group"><label>Téléphone</label><input class="form-control" name="phone" value="${r.phone || ''}" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Type</label><select class="form-control" name="type"><option ${r.type === 'Appartement' ? 'selected' : ''}>Appartement</option><option ${r.type === 'Chambre' ? 'selected' : ''}>Chambre</option></select></div>
                <div class="form-group"><label>Unité</label><select class="form-control" name="unit">${rooms.map(rm => `<option ${r.unit === rm.name ? 'selected' : ''}>${rm.name}</option>`).join('')}</select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Date arrivée</label><input type="date" class="form-control" name="dateIn" value="${r.dateIn || today()}" required onchange="calcReservation(this.form)"></div>
                <div class="form-group"><label>Date départ</label><input type="date" class="form-control" name="dateOut" value="${r.dateOut || ''}" required onchange="calcReservation(this.form)"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Prix/nuit</label><input type="number" class="form-control" name="pricePerNight" value="${r.pricePerNight || ''}" required onchange="calcReservation(this.form)"></div>
                <div class="form-group"><label>Acompte</label><input type="number" class="form-control" name="deposit" value="${r.deposit || 0}" onchange="calcReservation(this.form)"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Statut paiement</label><select class="form-control" name="paymentStatus"><option ${r.paymentStatus === 'Payé' ? 'selected' : ''}>Payé</option><option ${r.paymentStatus === 'Acompte' ? 'selected' : ''}>Acompte</option><option ${r.paymentStatus === 'En attente' ? 'selected' : ''}>En attente</option></select></div>
                <div class="form-group"><label>Statut réservation</label><select class="form-control" name="status"><option ${r.status === 'Confirmée' ? 'selected' : ''}>Confirmée</option><option ${r.status === 'En attente' ? 'selected' : ''}>En attente</option><option ${r.status === 'Annulée' ? 'selected' : ''}>Annulée</option><option ${r.status === 'Terminée' ? 'selected' : ''}>Terminée</option></select></div>
            </div>
            <div class="form-group"><label>Note</label><textarea class="form-control" name="note">${r.note || ''}</textarea></div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px"><i class="fas fa-save"></i> Enregistrer</button>
        </form>
    `);
}

function calcReservation(form) {
    const dateIn = new Date(form.dateIn.value);
    const dateOut = new Date(form.dateOut.value);
    if (dateIn && dateOut && dateOut > dateIn) {
        const nights = Math.ceil((dateOut - dateIn) / (1000 * 60 * 60 * 24));
        const total = nights * (parseInt(form.pricePerNight.value) || 0);
        // Just calculate, no display field needed - saved on submit
    }
}

function saveReservation(e, editId) {
    e.preventDefault();
    const form = e.target;
    const reservations = getData('reservations') || [];
    const dateIn = new Date(form.dateIn.value);
    const dateOut = new Date(form.dateOut.value);
    const nights = Math.max(1, Math.ceil((dateOut - dateIn) / (1000 * 60 * 60 * 24)));
    const total = nights * (parseInt(form.pricePerNight.value) || 0);
    const deposit = parseInt(form.deposit.value) || 0;

    const data = {
        id: editId || 'RSV-' + String(reservations.length + 1).padStart(3, '0'),
        client: form.client.value,
        phone: form.phone.value,
        type: form.type.value,
        unit: form.unit.value,
        dateIn: form.dateIn.value,
        dateOut: form.dateOut.value,
        nights,
        pricePerNight: parseInt(form.pricePerNight.value),
        total,
        deposit,
        remaining: total - deposit,
        paymentStatus: form.paymentStatus.value,
        status: form.status.value,
        note: form.note.value
    };

    if (editId) {
        const idx = reservations.findIndex(r => r.id === editId);
        if (idx >= 0) reservations[idx] = data;
    } else {
        reservations.push(data);
    }
    setData('reservations', reservations);
    closeModal();
    showToast('Réservation enregistrée');
    navigateTo('reservations');
}

function editReservation(id) {
    const reservations = getData('reservations') || [];
    const r = reservations.find(x => x.id === id);
    if (r) openReservationForm(r);
}

function deleteReservation(id) {
    if (!confirm('Supprimer cette réservation ?')) return;
    let reservations = getData('reservations') || [];
    reservations = reservations.filter(r => r.id !== id);
    setData('reservations', reservations);
    showToast('Réservation supprimée', 'error');
    navigateTo('reservations');
}

function filterReservations(query) {
    const rows = document.querySelectorAll('#reservationsTable tbody tr');
    query = query.toLowerCase();
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

function filterReservationsByStatus(status) {
    const reservations = getData('reservations') || [];
    const filtered = status ? reservations.filter(r => r.status === status) : reservations;
    // Re-render with filter would be complex, use simple row hiding
    const rows = document.querySelectorAll('#reservationsTable tbody tr');
    rows.forEach((row, i) => {
        if (!status) { row.style.display = ''; return; }
        const res = reservations[i];
        row.style.display = res && res.status === status ? '' : 'none';
    });
}

// ===== ROOMS MODULE =====
function renderRooms() {
    const rooms = getData('rooms') || [];
    const occupied = rooms.filter(r => r.status === 'Occupé').length;
    const available = rooms.filter(r => r.status === 'Disponible').length;
    const cleaning = rooms.filter(r => r.status === 'Nettoyage').length;
    const maintenance = rooms.filter(r => r.status === 'Maintenance').length;

    return `
    <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-building"></i></div><div class="kpi-info"><div class="label">Total</div><div class="value">${rooms.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red"><i class="fas fa-door-closed"></i></div><div class="kpi-info"><div class="label">Occupés</div><div class="value">${occupied}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green"><i class="fas fa-door-open"></i></div><div class="kpi-info"><div class="label">Disponibles</div><div class="value">${available}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange"><i class="fas fa-broom"></i></div><div class="kpi-info"><div class="label">Nettoyage</div><div class="value">${cleaning}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red"><i class="fas fa-wrench"></i></div><div class="kpi-info"><div class="label">Maintenance</div><div class="value">${maintenance}</div></div></div>
    </div>
    <div class="module-header">
        <h3>Gestion des unités</h3>
        <button class="btn btn-primary" onclick="openRoomForm()"><i class="fas fa-plus"></i> Ajouter unité</button>
    </div>
    <div class="rooms-grid">
        ${rooms.map(r => `
        <div class="room-card">
            <div style="display:flex;justify-content:space-between;align-items:start">
                <div>
                    <div class="room-name">${r.name}</div>
                    <div class="room-type">${r.type} • ${r.capacity} pers. • ${r.floor}</div>
                </div>
                <span class="status ${r.status === 'Disponible' ? 'green' : r.status === 'Occupé' ? 'red' : r.status === 'Nettoyage' ? 'orange' : 'gray'}">${r.status}</span>
            </div>
            <div class="room-price">${formatMoney(r.price)}/nuit</div>
            <div style="margin-top:8px;font-size:11px;color:var(--text-gray)">${(r.equipment || []).join(', ')}</div>
            <div style="margin-top:10px;display:flex;gap:6px">
                <button class="action-btn edit" onclick="editRoom('${r.id}')"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteRoom('${r.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('')}
    </div>`;
}

function openRoomForm(room = null) {
    const r = room || {};
    const equip = r.equipment || [];
    openModal(room ? 'Modifier unité' : 'Ajouter unité', `
        <form onsubmit="saveRoom(event, '${r.id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Nom</label><input class="form-control" name="name" value="${r.name || ''}" required placeholder="Ex: Appartement 1A"></div>
                <div class="form-group"><label>Type</label><select class="form-control" name="type"><option ${r.type === 'Appartement' ? 'selected' : ''}>Appartement</option><option ${r.type === 'Chambre' ? 'selected' : ''}>Chambre</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Capacité</label><input type="number" class="form-control" name="capacity" value="${r.capacity || 2}" min="1"></div>
                <div class="form-group"><label>Prix/nuit</label><input type="number" class="form-control" name="price" value="${r.price || ''}" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Étage/Zone</label><input class="form-control" name="floor" value="${r.floor || ''}"></div>
                <div class="form-group"><label>Statut</label><select class="form-control" name="status"><option ${r.status === 'Disponible' ? 'selected' : ''}>Disponible</option><option ${r.status === 'Occupé' ? 'selected' : ''}>Occupé</option><option ${r.status === 'Nettoyage' ? 'selected' : ''}>Nettoyage</option><option ${r.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option><option ${r.status === 'Hors service' ? 'selected' : ''}>Hors service</option></select></div>
            </div>
            <div class="form-group"><label>Description</label><input class="form-control" name="description" value="${r.description || ''}"></div>
            <div class="form-group"><label>Équipements</label>
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
                    ${['WiFi','Climatisation','Cuisine','TV','Parking','Balcon','Coffre'].map(eq => `<label style="font-size:12px;display:flex;align-items:center;gap:4px"><input type="checkbox" name="equipment" value="${eq}" ${equip.includes(eq) ? 'checked' : ''}> ${eq}</label>`).join('')}
                </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px"><i class="fas fa-save"></i> Enregistrer</button>
        </form>
    `);
}

function saveRoom(e, editId) {
    e.preventDefault();
    const form = e.target;
    const rooms = getData('rooms') || [];
    const equipment = Array.from(form.querySelectorAll('input[name="equipment"]:checked')).map(cb => cb.value);
    const data = {
        id: editId || generateId('RM'),
        name: form.name.value, type: form.type.value, capacity: parseInt(form.capacity.value),
        price: parseInt(form.price.value), status: form.status.value, floor: form.floor.value,
        description: form.description.value, equipment
    };
    if (editId) { const idx = rooms.findIndex(r => r.id === editId); if (idx >= 0) rooms[idx] = data; }
    else rooms.push(data);
    setData('rooms', rooms);
    closeModal();
    showToast('Unité enregistrée');
    navigateTo('rooms');
}

function editRoom(id) { const rooms = getData('rooms') || []; const r = rooms.find(x => x.id === id); if (r) openRoomForm(r); }
function deleteRoom(id) { if (!confirm('Supprimer cette unité ?')) return; setData('rooms', (getData('rooms') || []).filter(r => r.id !== id)); showToast('Unité supprimée', 'error'); navigateTo('rooms'); }

// ===== RESTAURANT MODULE =====
function renderRestaurant() {
    const orders = getData('orders') || [];
    const todayOrders = orders.filter(o => o.time && o.time.startsWith(today()));
    const revenue = todayOrders.filter(o => o.paymentStatus === 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const preparing = todayOrders.filter(o => o.status === 'En préparation' || o.status === 'À préparer').length;
    const delivered = todayOrders.filter(o => o.status === 'Livrée' || o.status === 'Prête').length;
    const pending = todayOrders.filter(o => o.paymentStatus !== 'Payé').reduce((s, o) => s + (o.amount || 0), 0);

    return `
    <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card"><div class="kpi-icon green"><i class="fas fa-utensils"></i></div><div class="kpi-info"><div class="label">Commandes du jour</div><div class="value">${todayOrders.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon gold"><i class="fas fa-coins"></i></div><div class="kpi-info"><div class="label">CA Restaurant</div><div class="value">${formatMoney(revenue)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange"><i class="fas fa-fire"></i></div><div class="kpi-info"><div class="label">En préparation</div><div class="value">${preparing}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green"><i class="fas fa-check"></i></div><div class="kpi-info"><div class="label">Servies/Livrées</div><div class="value">${delivered}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red"><i class="fas fa-clock"></i></div><div class="kpi-info"><div class="label">Impayés</div><div class="value">${formatMoney(pending)}</div></div></div>
    </div>
    <div class="module-header">
        <h3>Commandes</h3>
        <button class="btn btn-primary" onclick="openOrderForm()"><i class="fas fa-plus"></i> Nouvelle commande</button>
    </div>
    <div class="filters-bar">
        <input type="text" class="search-input" placeholder="Rechercher..." onkeyup="filterTable('ordersTable', this.value)">
        <select class="filter-select" onchange="filterTableByCol('ordersTable', 7, this.value)">
            <option value="">Tous statuts</option>
            <option value="À préparer">À préparer</option>
            <option value="En préparation">En préparation</option>
            <option value="Prête">Prête</option>
            <option value="Livrée">Livrée</option>
            <option value="Annulée">Annulée</option>
        </select>
    </div>
    <div class="card"><div class="table-container">
        <table id="ordersTable"><thead><tr><th>ID</th><th>Heure</th><th>Client</th><th>Type</th><th>Articles</th><th>Montant</th><th>Paiement</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>${orders.map(o => `<tr>
            <td><strong>${o.id}</strong></td>
            <td>${o.time ? new Date(o.time).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'}) : '-'}</td>
            <td>${o.client}</td>
            <td><span class="status ${o.type === 'Livraison' ? 'blue' : 'gray'}">${o.type}</span></td>
            <td style="max-width:180px">${o.items}</td>
            <td><strong>${formatMoney(o.amount)}</strong></td>
            <td><span class="status ${o.paymentStatus === 'Payé' ? 'green' : 'red'}">${o.paymentStatus}</span></td>
            <td><span class="status ${o.status === 'Livrée' || o.status === 'Prête' ? 'green' : o.status === 'En préparation' ? 'orange' : o.status === 'Annulée' ? 'red' : 'blue'}">${o.status}</span></td>
            <td class="actions-cell">
                <button class="action-btn edit" onclick="editOrder('${o.id}')"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteOrder('${o.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}</tbody></table>
        ${orders.length === 0 ? '<div class="empty-state"><i class="fas fa-utensils"></i><p>Aucune commande</p></div>' : ''}
    </div></div>`;
}

function openOrderForm(order = null) {
    const o = order || {};
    openModal(order ? 'Modifier commande' : 'Nouvelle commande', `
        <form onsubmit="saveOrder(event, '${o.id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Client</label><input class="form-control" name="client" value="${o.client || ''}" required></div>
                <div class="form-group"><label>Téléphone</label><input class="form-control" name="phone" value="${o.phone || ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Type</label><select class="form-control" name="type"><option ${o.type === 'Sur place' ? 'selected' : ''}>Sur place</option><option ${o.type === 'À emporter' ? 'selected' : ''}>À emporter</option><option ${o.type === 'Livraison' ? 'selected' : ''}>Livraison</option></select></div>
                <div class="form-group"><label>Montant</label><input type="number" class="form-control" name="amount" value="${o.amount || ''}" required></div>
            </div>
            <div class="form-group"><label>Articles commandés</label><textarea class="form-control" name="items" required>${o.items || ''}</textarea></div>
            <div class="form-row">
                <div class="form-group"><label>Mode paiement</label><select class="form-control" name="payment"><option ${o.payment === 'Espèces' ? 'selected' : ''}>Espèces</option><option ${o.payment === 'MVola' ? 'selected' : ''}>MVola</option><option ${o.payment === 'Orange Money' ? 'selected' : ''}>Orange Money</option><option ${o.payment === 'Carte' ? 'selected' : ''}>Carte</option><option ${o.payment === 'Non payé' ? 'selected' : ''}>Non payé</option></select></div>
                <div class="form-group"><label>Statut paiement</label><select class="form-control" name="paymentStatus"><option ${o.paymentStatus === 'Payé' ? 'selected' : ''}>Payé</option><option ${o.paymentStatus === 'En attente' ? 'selected' : ''}>En attente</option></select></div>
            </div>
            <div class="form-group"><label>Statut commande</label><select class="form-control" name="status"><option ${o.status === 'À préparer' ? 'selected' : ''}>À préparer</option><option ${o.status === 'En préparation' ? 'selected' : ''}>En préparation</option><option ${o.status === 'Prête' ? 'selected' : ''}>Prête</option><option ${o.status === 'Livrée' ? 'selected' : ''}>Livrée</option><option ${o.status === 'Annulée' ? 'selected' : ''}>Annulée</option></select></div>
            <div class="form-group"><label>Note</label><textarea class="form-control" name="note">${o.note || ''}</textarea></div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px"><i class="fas fa-save"></i> Enregistrer</button>
        </form>
    `);
}

function saveOrder(e, editId) {
    e.preventDefault();
    const form = e.target;
    const orders = getData('orders') || [];
    const data = {
        id: editId || 'CMD-' + String(orders.length + 1).padStart(3, '0'),
        time: today() + 'T' + new Date().toTimeString().slice(0, 5),
        client: form.client.value, phone: form.phone.value, type: form.type.value,
        items: form.items.value, amount: parseInt(form.amount.value),
        payment: form.payment.value, paymentStatus: form.paymentStatus.value,
        status: form.status.value, note: form.note.value
    };
    if (editId) { const idx = orders.findIndex(o => o.id === editId); if (idx >= 0) { data.time = orders[idx].time; orders[idx] = data; } }
    else orders.push(data);
    setData('orders', orders);
    closeModal(); showToast('Commande enregistrée'); navigateTo('restaurant');
}

function editOrder(id) { const orders = getData('orders') || []; const o = orders.find(x => x.id === id); if (o) openOrderForm(o); }
function deleteOrder(id) { if (!confirm('Supprimer cette commande ?')) return; setData('orders', (getData('orders') || []).filter(o => o.id !== id)); showToast('Commande supprimée', 'error'); navigateTo('restaurant'); }

// ===== DELIVERIES MODULE =====
function renderDeliveries() {
    const deliveries = getData('deliveries') || [];
    const inProgress = deliveries.filter(d => d.status === 'En route' || d.status === 'En attente');
    const completed = deliveries.filter(d => d.status === 'Livrée');
    const toCollect = deliveries.filter(d => d.payment === 'À encaisser').reduce((s, d) => s + (d.total || 0), 0);

    return `
    <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-motorcycle"></i></div><div class="kpi-info"><div class="label">En cours</div><div class="value">${inProgress.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green"><i class="fas fa-check-circle"></i></div><div class="kpi-info"><div class="label">Terminées</div><div class="value">${completed.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange"><i class="fas fa-money-bill"></i></div><div class="kpi-info"><div class="label">À encaisser</div><div class="value">${formatMoney(toCollect)}</div></div></div>
    </div>
    <div class="module-header">
        <h3>Livraisons</h3>
        <button class="btn btn-primary" onclick="openDeliveryForm()"><i class="fas fa-plus"></i> Nouvelle livraison</button>
    </div>
    <div class="card"><div class="table-container">
        <table id="deliveriesTable"><thead><tr><th>Client</th><th>Adresse</th><th>Livreur</th><th>Montant</th><th>Heure</th><th>Statut</th><th>Paiement</th><th>Actions</th></tr></thead>
        <tbody>${deliveries.map(d => `<tr>
            <td>${d.client}<br><small style="color:var(--text-gray)">${d.phone}</small></td>
            <td>${d.address}</td>
            <td>${d.driver}</td>
            <td><strong>${formatMoney(d.total)}</strong></td>
            <td>${d.departure} → ${d.eta}</td>
            <td><span class="status ${d.status === 'Livrée' ? 'green' : d.status === 'En route' ? 'blue' : d.status === 'Annulée' ? 'red' : 'orange'}">${d.status}</span></td>
            <td><span class="status ${d.payment === 'Payé' ? 'green' : 'orange'}">${d.payment}</span></td>
            <td class="actions-cell">
                <button class="action-btn edit" onclick="editDelivery('${d.id}')"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteDelivery('${d.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}</tbody></table>
        ${deliveries.length === 0 ? '<div class="empty-state"><i class="fas fa-motorcycle"></i><p>Aucune livraison</p></div>' : ''}
    </div></div>`;
}

function openDeliveryForm(delivery = null) {
    const d = delivery || {};
    const staff = (getData('staff') || []).filter(s => s.position === 'Livreur');
    openModal(delivery ? 'Modifier livraison' : 'Nouvelle livraison', `
        <form onsubmit="saveDelivery(event, '${d.id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Client</label><input class="form-control" name="client" value="${d.client || ''}" required></div>
                <div class="form-group"><label>Téléphone</label><input class="form-control" name="phone" value="${d.phone || ''}"></div>
            </div>
            <div class="form-group"><label>Adresse / Zone</label><input class="form-control" name="address" value="${d.address || ''}" required></div>
            <div class="form-row">
                <div class="form-group"><label>Commande liée</label><input class="form-control" name="order" value="${d.order || ''}"></div>
                <div class="form-group"><label>Livreur</label><select class="form-control" name="driver">${staff.map(s => `<option ${d.driver === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}<option ${!staff.find(s => s.name === d.driver) ? 'selected' : ''}>Autre</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Frais livraison</label><input type="number" class="form-control" name="deliveryFee" value="${d.deliveryFee || 1500}"></div>
                <div class="form-group"><label>Montant total</label><input type="number" class="form-control" name="total" value="${d.total || ''}" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Heure départ</label><input type="time" class="form-control" name="departure" value="${d.departure || ''}"></div>
                <div class="form-group"><label>Heure prévue</label><input type="time" class="form-control" name="eta" value="${d.eta || ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Statut</label><select class="form-control" name="status"><option ${d.status === 'En attente' ? 'selected' : ''}>En attente</option><option ${d.status === 'En route' ? 'selected' : ''}>En route</option><option ${d.status === 'Livrée' ? 'selected' : ''}>Livrée</option><option ${d.status === 'Annulée' ? 'selected' : ''}>Annulée</option></select></div>
                <div class="form-group"><label>Paiement</label><select class="form-control" name="payment"><option ${d.payment === 'Payé' ? 'selected' : ''}>Payé</option><option ${d.payment === 'À encaisser' ? 'selected' : ''}>À encaisser</option></select></div>
            </div>
            <div class="form-group"><label>Note</label><textarea class="form-control" name="note">${d.note || ''}</textarea></div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px"><i class="fas fa-save"></i> Enregistrer</button>
        </form>
    `);
}

function saveDelivery(e, editId) {
    e.preventDefault();
    const form = e.target;
    const deliveries = getData('deliveries') || [];
    const data = {
        id: editId || generateId('LIV'), client: form.client.value, phone: form.phone.value,
        address: form.address.value, order: form.order.value, driver: form.driver.value,
        deliveryFee: parseInt(form.deliveryFee.value) || 0, total: parseInt(form.total.value),
        departure: form.departure.value, eta: form.eta.value,
        status: form.status.value, payment: form.payment.value, note: form.note.value
    };
    if (editId) { const idx = deliveries.findIndex(d => d.id === editId); if (idx >= 0) deliveries[idx] = data; }
    else deliveries.push(data);
    setData('deliveries', deliveries); closeModal(); showToast('Livraison enregistrée'); navigateTo('deliveries');
}

function editDelivery(id) { const d = (getData('deliveries') || []).find(x => x.id === id); if (d) openDeliveryForm(d); }
function deleteDelivery(id) { if (!confirm('Supprimer ?')) return; setData('deliveries', (getData('deliveries') || []).filter(d => d.id !== id)); showToast('Supprimé', 'error'); navigateTo('deliveries'); }

// ===== CLIENTS MODULE =====
function renderClients() {
    const clients = getData('clients') || [];
    const vip = clients.filter(c => c.status === 'VIP').length;
    const toReach = clients.filter(c => c.status === 'À relancer').length;

    return `
    <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-users"></i></div><div class="kpi-info"><div class="label">Total clients</div><div class="value">${clients.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon gold"><i class="fas fa-crown"></i></div><div class="kpi-info"><div class="label">VIP</div><div class="value">${vip}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange"><i class="fas fa-phone"></i></div><div class="kpi-info"><div class="label">À relancer</div><div class="value">${toReach}</div></div></div>
    </div>
    <div class="module-header">
        <h3>Mini CRM</h3>
        <button class="btn btn-primary" onclick="openClientForm()"><i class="fas fa-plus"></i> Nouveau client</button>
    </div>
    <div class="filters-bar">
        <input type="text" class="search-input" placeholder="Rechercher nom, tél..." onkeyup="filterTable('clientsTable', this.value)">
        <select class="filter-select" onchange="filterTableByCol('clientsTable', 5, this.value)">
            <option value="">Tous</option><option>VIP</option><option>Fidèle</option><option>Nouveau</option><option>À relancer</option>
        </select>
    </div>
    <div class="card"><div class="table-container">
        <table id="clientsTable"><thead><tr><th>Nom</th><th>Téléphone</th><th>Type</th><th>Dépensé</th><th>Dernière visite</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>${clients.map(c => `<tr>
            <td><strong>${c.name}</strong>${c.email ? '<br><small style="color:var(--text-gray)">'+c.email+'</small>' : ''}</td>
            <td>${c.phone}</td>
            <td>${c.type}</td>
            <td><strong>${formatMoney(c.totalSpent)}</strong></td>
            <td>${formatDate(c.lastVisit)}</td>
            <td><span class="status ${c.status === 'VIP' ? 'gold' : c.status === 'Fidèle' ? 'green' : c.status === 'À relancer' ? 'orange' : 'blue'}">${c.status}</span></td>
            <td class="actions-cell">
                <a href="https://wa.me/${(c.phone || '').replace(/[^0-9]/g, '')}?text=Bonjour ${c.name}, c'est Le Paradisier 🌴 - Toamasina" target="_blank" class="action-btn whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                <button class="action-btn edit" onclick="editClient('${c.id}')"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteClient('${c.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}</tbody></table>
        ${clients.length === 0 ? '<div class="empty-state"><i class="fas fa-users"></i><p>Aucun client</p></div>' : ''}
    </div></div>`;
}

function openClientForm(client = null) {
    const c = client || {};
    openModal(client ? 'Modifier client' : 'Nouveau client', `
        <form onsubmit="saveClient(event, '${c.id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Nom</label><input class="form-control" name="name" value="${c.name || ''}" required></div>
                <div class="form-group"><label>Téléphone</label><input class="form-control" name="phone" value="${c.phone || ''}" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Email</label><input class="form-control" name="email" value="${c.email || ''}"></div>
                <div class="form-group"><label>Type</label><select class="form-control" name="type"><option ${c.type === 'Restaurant' ? 'selected' : ''}>Restaurant</option><option ${c.type === 'Appartement' ? 'selected' : ''}>Appartement</option><option ${c.type === 'Les deux' ? 'selected' : ''}>Les deux</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Statut</label><select class="form-control" name="status"><option ${c.status === 'Nouveau' ? 'selected' : ''}>Nouveau</option><option ${c.status === 'Fidèle' ? 'selected' : ''}>Fidèle</option><option ${c.status === 'VIP' ? 'selected' : ''}>VIP</option><option ${c.status === 'À relancer' ? 'selected' : ''}>À relancer</option></select></div>
                <div class="form-group"><label>Montant total dépensé</label><input type="number" class="form-control" name="totalSpent" value="${c.totalSpent || 0}"></div>
            </div>
            <div class="form-group"><label>Notes</label><textarea class="form-control" name="notes">${c.notes || ''}</textarea></div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px"><i class="fas fa-save"></i> Enregistrer</button>
        </form>
    `);
}

function saveClient(e, editId) {
    e.preventDefault();
    const form = e.target;
    const clients = getData('clients') || [];
    const data = {
        id: editId || generateId('CLT'), name: form.name.value, phone: form.phone.value,
        email: form.email.value, type: form.type.value, status: form.status.value,
        totalSpent: parseInt(form.totalSpent.value) || 0, reservations: 0, orders: 0,
        lastVisit: today(), notes: form.notes.value
    };
    if (editId) { const idx = clients.findIndex(c => c.id === editId); if (idx >= 0) { data.reservations = clients[idx].reservations; data.orders = clients[idx].orders; clients[idx] = data; } }
    else clients.push(data);
    setData('clients', clients); closeModal(); showToast('Client enregistré'); navigateTo('clients');
}

function editClient(id) { const c = (getData('clients') || []).find(x => x.id === id); if (c) openClientForm(c); }
function deleteClient(id) { if (!confirm('Supprimer ce client ?')) return; setData('clients', (getData('clients') || []).filter(c => c.id !== id)); showToast('Client supprimé', 'error'); navigateTo('clients'); }

// ===== STOCK MODULE =====
function renderStock() {
    const stock = getData('stock') || [];
    const critical = stock.filter(s => s.status === 'Critique').length;
    const low = stock.filter(s => s.status === 'Faible').length;
    const totalValue = stock.reduce((s, p) => s + (p.value || 0), 0);

    return `
    <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-boxes-stacked"></i></div><div class="kpi-info"><div class="label">Produits</div><div class="value">${stock.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red"><i class="fas fa-exclamation-triangle"></i></div><div class="kpi-info"><div class="label">Critique</div><div class="value">${critical}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange"><i class="fas fa-exclamation"></i></div><div class="kpi-info"><div class="label">Faible</div><div class="value">${low}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon gold"><i class="fas fa-coins"></i></div><div class="kpi-info"><div class="label">Valeur stock</div><div class="value">${formatMoney(totalValue)}</div></div></div>
    </div>
    <div class="module-header">
        <h3>Inventaire</h3>
        <button class="btn btn-primary" onclick="openStockForm()"><i class="fas fa-plus"></i> Ajouter produit</button>
    </div>
    <div class="filters-bar">
        <input type="text" class="search-input" placeholder="Rechercher produit..." onkeyup="filterTable('stockTable', this.value)">
        <select class="filter-select" onchange="filterTableByCol('stockTable', 1, this.value)">
            <option value="">Toutes catégories</option>
            <option>Cuisine</option><option>Boissons</option><option>Nettoyage</option><option>Chambre</option><option>Maintenance</option>
        </select>
    </div>
    <div class="card"><div class="table-container">
        <table id="stockTable"><thead><tr><th>Produit</th><th>Catégorie</th><th>Quantité</th><th>Seuil</th><th>Prix achat</th><th>Valeur</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>${stock.map(s => `<tr>
            <td><strong>${s.product}</strong><br><small style="color:var(--text-gray)">${s.supplier || ''}</small></td>
            <td>${s.category}</td>
            <td>${s.quantity} ${s.unit}</td>
            <td>${s.threshold} ${s.unit}</td>
            <td>${formatMoney(s.buyPrice)}</td>
            <td>${formatMoney(s.value)}</td>
            <td><span class="status ${s.status === 'OK' ? 'green' : s.status === 'Faible' ? 'orange' : 'red'}">${s.status}</span></td>
            <td class="actions-cell">
                <button class="action-btn edit" onclick="editStock('${s.id}')"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteStock('${s.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}</tbody></table>
        ${stock.length === 0 ? '<div class="empty-state"><i class="fas fa-boxes-stacked"></i><p>Stock vide</p></div>' : ''}
    </div></div>`;
}

function openStockForm(item = null) {
    const s = item || {};
    openModal(item ? 'Modifier produit' : 'Ajouter produit', `
        <form onsubmit="saveStock(event, '${s.id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Produit</label><input class="form-control" name="product" value="${s.product || ''}" required></div>
                <div class="form-group"><label>Catégorie</label><select class="form-control" name="category"><option ${s.category === 'Cuisine' ? 'selected' : ''}>Cuisine</option><option ${s.category === 'Boissons' ? 'selected' : ''}>Boissons</option><option ${s.category === 'Nettoyage' ? 'selected' : ''}>Nettoyage</option><option ${s.category === 'Chambre' ? 'selected' : ''}>Chambre</option><option ${s.category === 'Maintenance' ? 'selected' : ''}>Maintenance</option><option ${s.category === 'Autre' ? 'selected' : ''}>Autre</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Quantité</label><input type="number" class="form-control" name="quantity" value="${s.quantity || 0}" required></div>
                <div class="form-group"><label>Unité</label><select class="form-control" name="unit"><option ${s.unit === 'kg' ? 'selected' : ''}>kg</option><option ${s.unit === 'L' ? 'selected' : ''}>L</option><option ${s.unit === 'pièce' ? 'selected' : ''}>pièce</option><option ${s.unit === 'paquet' ? 'selected' : ''}>paquet</option><option ${s.unit === 'bouteille' ? 'selected' : ''}>bouteille</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Seuil minimum</label><input type="number" class="form-control" name="threshold" value="${s.threshold || 5}"></div>
                <div class="form-group"><label>Prix d'achat unitaire</label><input type="number" class="form-control" name="buyPrice" value="${s.buyPrice || ''}" required></div>
            </div>
            <div class="form-group"><label>Fournisseur</label><input class="form-control" name="supplier" value="${s.supplier || ''}"></div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px"><i class="fas fa-save"></i> Enregistrer</button>
        </form>
    `);
}

function saveStock(e, editId) {
    e.preventDefault();
    const form = e.target;
    const stock = getData('stock') || [];
    const qty = parseInt(form.quantity.value) || 0;
    const threshold = parseInt(form.threshold.value) || 5;
    const buyPrice = parseInt(form.buyPrice.value) || 0;
    let status = 'OK';
    if (qty <= 0) status = 'Critique';
    else if (qty <= threshold) status = qty < threshold ? 'Critique' : 'Faible';

    const data = {
        id: editId || generateId('STK'), product: form.product.value, category: form.category.value,
        quantity: qty, unit: form.unit.value, threshold, buyPrice,
        value: qty * buyPrice, supplier: form.supplier.value, lastEntry: today(), status
    };
    if (editId) { const idx = stock.findIndex(s => s.id === editId); if (idx >= 0) stock[idx] = data; }
    else stock.push(data);
    setData('stock', stock); closeModal(); showToast('Produit enregistré'); navigateTo('stock');
}

function editStock(id) { const s = (getData('stock') || []).find(x => x.id === id); if (s) openStockForm(s); }
function deleteStock(id) { if (!confirm('Supprimer ?')) return; setData('stock', (getData('stock') || []).filter(s => s.id !== id)); showToast('Supprimé', 'error'); navigateTo('stock'); }

// ===== EXPENSES MODULE =====
function renderExpenses() {
    const expenses = getData('expenses') || [];
    const todayExp = expenses.filter(e => e.date === today());
    const monthExp = expenses.filter(e => e.date && e.date.startsWith(today().substring(0, 7)));
    const todayTotal = todayExp.reduce((s, e) => s + (e.amount || 0), 0);
    const monthTotal = monthExp.reduce((s, e) => s + (e.amount || 0), 0);

    return `
    <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card"><div class="kpi-icon red"><i class="fas fa-receipt"></i></div><div class="kpi-info"><div class="label">Dépenses du jour</div><div class="value">${formatMoney(todayTotal)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange"><i class="fas fa-calendar"></i></div><div class="kpi-info"><div class="label">Dépenses du mois</div><div class="value">${formatMoney(monthTotal)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-list"></i></div><div class="kpi-info"><div class="label">Nb dépenses</div><div class="value">${expenses.length}</div></div></div>
    </div>
    <div class="module-header">
        <h3>Suivi des dépenses</h3>
        <button class="btn btn-primary" onclick="openExpenseForm()"><i class="fas fa-plus"></i> Ajouter dépense</button>
    </div>
    <div class="filters-bar">
        <input type="text" class="search-input" placeholder="Rechercher..." onkeyup="filterTable('expensesTable', this.value)">
        <select class="filter-select" onchange="filterTableByCol('expensesTable', 2, this.value)">
            <option value="">Toutes catégories</option>
            <option>Achats restaurant</option><option>Salaires</option><option>Électricité</option><option>Eau</option><option>Internet</option><option>Maintenance</option><option>Nettoyage</option><option>Transport</option><option>Marketing</option><option>Autre</option>
        </select>
    </div>
    <div class="card"><div class="table-container">
        <table id="expensesTable"><thead><tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Fournisseur</th><th>Montant</th><th>Paiement</th><th>Actions</th></tr></thead>
        <tbody>${expenses.map(e => `<tr>
            <td>${formatDate(e.date)}</td>
            <td><strong>${e.description}</strong></td>
            <td><span class="status gray">${e.category}</span></td>
            <td>${e.supplier || '-'}</td>
            <td><strong style="color:var(--red)">${formatMoney(e.amount)}</strong></td>
            <td>${e.payment}</td>
            <td class="actions-cell">
                <button class="action-btn edit" onclick="editExpense('${e.id}')"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteExpense('${e.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}</tbody></table>
        ${expenses.length === 0 ? '<div class="empty-state"><i class="fas fa-receipt"></i><p>Aucune dépense</p></div>' : ''}
    </div></div>`;
}

function openExpenseForm(expense = null) {
    const e = expense || {};
    openModal(expense ? 'Modifier dépense' : 'Nouvelle dépense', `
        <form onsubmit="saveExpense(event, '${e.id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" class="form-control" name="date" value="${e.date || today()}" required></div>
                <div class="form-group"><label>Montant</label><input type="number" class="form-control" name="amount" value="${e.amount || ''}" required></div>
            </div>
            <div class="form-group"><label>Description</label><input class="form-control" name="description" value="${e.description || ''}" required></div>
            <div class="form-row">
                <div class="form-group"><label>Catégorie</label><select class="form-control" name="category"><option ${e.category === 'Achats restaurant' ? 'selected' : ''}>Achats restaurant</option><option ${e.category === 'Salaires' ? 'selected' : ''}>Salaires</option><option ${e.category === 'Électricité' ? 'selected' : ''}>Électricité</option><option ${e.category === 'Eau' ? 'selected' : ''}>Eau</option><option ${e.category === 'Internet' ? 'selected' : ''}>Internet</option><option ${e.category === 'Maintenance' ? 'selected' : ''}>Maintenance</option><option ${e.category === 'Nettoyage' ? 'selected' : ''}>Nettoyage</option><option ${e.category === 'Transport' ? 'selected' : ''}>Transport</option><option ${e.category === 'Marketing' ? 'selected' : ''}>Marketing</option><option ${e.category === 'Autre' ? 'selected' : ''}>Autre</option></select></div>
                <div class="form-group"><label>Fournisseur</label><input class="form-control" name="supplier" value="${e.supplier || ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Mode paiement</label><select class="form-control" name="payment"><option ${e.payment === 'Espèces' ? 'selected' : ''}>Espèces</option><option ${e.payment === 'MVola' ? 'selected' : ''}>MVola</option><option ${e.payment === 'Orange Money' ? 'selected' : ''}>Orange Money</option><option ${e.payment === 'Carte' ? 'selected' : ''}>Carte</option><option ${e.payment === 'Virement' ? 'selected' : ''}>Virement</option></select></div>
                <div class="form-group"><label>Référence</label><input class="form-control" name="reference" value="${e.reference || ''}"></div>
            </div>
            <div class="form-group"><label>Note</label><textarea class="form-control" name="note">${e.note || ''}</textarea></div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px"><i class="fas fa-save"></i> Enregistrer</button>
        </form>
    `);
}

function saveExpense(ev, editId) {
    ev.preventDefault();
    const form = ev.target;
    const expenses = getData('expenses') || [];
    const data = {
        id: editId || generateId('DEP'), date: form.date.value, description: form.description.value,
        category: form.category.value, supplier: form.supplier.value, amount: parseInt(form.amount.value),
        payment: form.payment.value, reference: form.reference.value, note: form.note.value
    };
    if (editId) { const idx = expenses.findIndex(e => e.id === editId); if (idx >= 0) expenses[idx] = data; }
    else expenses.push(data);
    setData('expenses', expenses); closeModal(); showToast('Dépense enregistrée'); navigateTo('expenses');
}

function editExpense(id) { const e = (getData('expenses') || []).find(x => x.id === id); if (e) openExpenseForm(e); }
function deleteExpense(id) { if (!confirm('Supprimer ?')) return; setData('expenses', (getData('expenses') || []).filter(e => e.id !== id)); showToast('Supprimé', 'error'); navigateTo('expenses'); }

// ===== FINANCES MODULE =====
function renderFinances() {
    const orders = getData('orders') || [];
    const reservations = getData('reservations') || [];
    const deliveries = getData('deliveries') || [];
    const expenses = getData('expenses') || [];

    const revenueRestaurant = orders.filter(o => o.paymentStatus === 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const revenueRooms = reservations.filter(r => r.paymentStatus === 'Payé').reduce((s, r) => s + (r.total || 0), 0);
    const revenueDelivery = deliveries.filter(d => d.payment === 'Payé').reduce((s, d) => s + (d.deliveryFee || 0), 0);
    const totalRevenue = revenueRestaurant + revenueRooms + revenueDelivery;
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;
    const pendingRes = reservations.filter(r => r.paymentStatus !== 'Payé').reduce((s, r) => s + (r.remaining || 0), 0);
    const pendingOrders = orders.filter(o => o.paymentStatus !== 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const pendingTotal = pendingRes + pendingOrders;

    return `
    <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-icon green"><i class="fas fa-utensils"></i></div><div class="kpi-info"><div class="label">Revenus Restaurant</div><div class="value">${formatMoney(revenueRestaurant)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-bed"></i></div><div class="kpi-info"><div class="label">Revenus Hébergement</div><div class="value">${formatMoney(revenueRooms)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-motorcycle"></i></div><div class="kpi-info"><div class="label">Revenus Livraisons</div><div class="value">${formatMoney(revenueDelivery)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon gold"><i class="fas fa-wallet"></i></div><div class="kpi-info"><div class="label">Revenus totaux</div><div class="value">${formatMoney(totalRevenue)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red"><i class="fas fa-arrow-down"></i></div><div class="kpi-info"><div class="label">Dépenses totales</div><div class="value">${formatMoney(totalExpenses)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon ${profit >= 0 ? 'green' : 'red'}"><i class="fas fa-chart-line"></i></div><div class="kpi-info"><div class="label">Bénéfice net</div><div class="value">${formatMoney(profit)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange"><i class="fas fa-clock"></i></div><div class="kpi-info"><div class="label">En attente</div><div class="value">${formatMoney(pendingTotal)}</div></div></div>
    </div>

    <div class="grid-2">
        <div class="card">
            <div class="card-header"><h3>💰 Revenus par source</h3></div>
            <div class="card-body"><div class="chart-container"><canvas id="chartRevenueSource"></canvas></div></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>📊 Dépenses par catégorie</h3></div>
            <div class="card-body"><div class="chart-container"><canvas id="chartExpensesCat"></canvas></div></div>
        </div>
    </div>

    <div class="card" style="margin-top:20px">
        <div class="card-header"><h3>📋 Paiements en attente</h3></div>
        <div class="card-body"><div class="table-container">
            <table><thead><tr><th>Type</th><th>Client</th><th>Montant dû</th><th>Statut</th></tr></thead>
            <tbody>
                ${reservations.filter(r => r.paymentStatus !== 'Payé').map(r => `<tr><td>Réservation ${r.id}</td><td>${r.client}</td><td><strong>${formatMoney(r.remaining)}</strong></td><td><span class="status orange">${r.paymentStatus}</span></td></tr>`).join('')}
                ${orders.filter(o => o.paymentStatus !== 'Payé').map(o => `<tr><td>Commande ${o.id}</td><td>${o.client}</td><td><strong>${formatMoney(o.amount)}</strong></td><td><span class="status red">Non payé</span></td></tr>`).join('')}
                ${pendingTotal === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-gray)">Aucun paiement en attente</td></tr>' : ''}
            </tbody></table>
        </div></div>
    </div>`;
}

function initFinanceCharts() {
    const orders = getData('orders') || [];
    const reservations = getData('reservations') || [];
    const deliveries = getData('deliveries') || [];
    const expenses = getData('expenses') || [];

    const ctx1 = document.getElementById('chartRevenueSource');
    if (ctx1) {
        charts.revenueSource = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Restaurant', 'Hébergement', 'Livraisons'],
                datasets: [{ data: [
                    orders.filter(o => o.paymentStatus === 'Payé').reduce((s, o) => s + (o.amount || 0), 0),
                    reservations.filter(r => r.paymentStatus === 'Payé').reduce((s, r) => s + (r.total || 0), 0),
                    deliveries.filter(d => d.payment === 'Payé').reduce((s, d) => s + (d.deliveryFee || 0), 0)
                ], backgroundColor: ['#12A150', '#0F3D3A', '#F59E0B'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    const ctx2 = document.getElementById('chartExpensesCat');
    if (ctx2) {
        const categories = {};
        expenses.forEach(e => { categories[e.category] = (categories[e.category] || 0) + (e.amount || 0); });
        charts.expensesCat = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: Object.keys(categories),
                datasets: [{ label: 'Montant', data: Object.values(categories), backgroundColor: '#E5484D' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }
}

// ===== STAFF MODULE =====
function renderStaff() {
    const staff = getData('staff') || [];
    const present = staff.filter(s => s.status === 'Présent').length;
    const absent = staff.filter(s => s.status === 'Absent' || s.status === 'Congé').length;

    return `
    <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-user-tie"></i></div><div class="kpi-info"><div class="label">Total personnel</div><div class="value">${staff.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green"><i class="fas fa-check"></i></div><div class="kpi-info"><div class="label">Présents</div><div class="value">${present}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red"><i class="fas fa-user-slash"></i></div><div class="kpi-info"><div class="label">Absents</div><div class="value">${absent}</div></div></div>
    </div>
    <div class="module-header">
        <h3>Équipe</h3>
        <button class="btn btn-primary" onclick="openStaffForm()"><i class="fas fa-plus"></i> Ajouter</button>
    </div>
    <div class="card"><div class="table-container">
        <table id="staffTable"><thead><tr><th>Nom</th><th>Poste</th><th>Téléphone</th><th>Statut</th><th>Service</th><th>Tâches</th><th>Actions</th></tr></thead>
        <tbody>${staff.map(s => `<tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.position}</td>
            <td>${s.phone}</td>
            <td><span class="status ${s.status === 'Présent' ? 'green' : s.status === 'Absent' ? 'red' : 'orange'}">${s.status}</span></td>
            <td>${s.shift || '-'}</td>
            <td style="max-width:180px;font-size:12px">${s.tasks || '-'}</td>
            <td class="actions-cell">
                <button class="action-btn edit" onclick="editStaff('${s.id}')"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteStaff('${s.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}</tbody></table>
        ${staff.length === 0 ? '<div class="empty-state"><i class="fas fa-users"></i><p>Aucun personnel</p></div>' : ''}
    </div></div>`;
}

function openStaffForm(member = null) {
    const s = member || {};
    openModal(member ? 'Modifier' : 'Ajouter personnel', `
        <form onsubmit="saveStaff(event, '${s.id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Nom</label><input class="form-control" name="name" value="${s.name || ''}" required></div>
                <div class="form-group"><label>Poste</label><select class="form-control" name="position"><option ${s.position === 'Cuisine' ? 'selected' : ''}>Cuisine</option><option ${s.position === 'Serveur' ? 'selected' : ''}>Serveur</option><option ${s.position === 'Réception' ? 'selected' : ''}>Réception</option><option ${s.position === 'Ménage' ? 'selected' : ''}>Ménage</option><option ${s.position === 'Livreur' ? 'selected' : ''}>Livreur</option><option ${s.position === 'Maintenance' ? 'selected' : ''}>Maintenance</option><option ${s.position === 'Gestion' ? 'selected' : ''}>Gestion</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Téléphone</label><input class="form-control" name="phone" value="${s.phone || ''}"></div>
                <div class="form-group"><label>Statut</label><select class="form-control" name="status"><option ${s.status === 'Présent' ? 'selected' : ''}>Présent</option><option ${s.status === 'Absent' ? 'selected' : ''}>Absent</option><option ${s.status === 'Congé' ? 'selected' : ''}>Congé</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Service du jour</label><input class="form-control" name="shift" value="${s.shift || ''}"></div>
                <div class="form-group"><label>Tâches assignées</label><input class="form-control" name="tasks" value="${s.tasks || ''}"></div>
            </div>
            <div class="form-group"><label>Note</label><textarea class="form-control" name="note">${s.note || ''}</textarea></div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px"><i class="fas fa-save"></i> Enregistrer</button>
        </form>
    `);
}

function saveStaff(e, editId) {
    e.preventDefault();
    const form = e.target;
    const staff = getData('staff') || [];
    const data = {
        id: editId || generateId('STF'), name: form.name.value, position: form.position.value,
        phone: form.phone.value, status: form.status.value, shift: form.shift.value,
        tasks: form.tasks.value, note: form.note.value
    };
    if (editId) { const idx = staff.findIndex(s => s.id === editId); if (idx >= 0) staff[idx] = data; }
    else staff.push(data);
    setData('staff', staff); closeModal(); showToast('Enregistré'); navigateTo('staff');
}

function editStaff(id) { const s = (getData('staff') || []).find(x => x.id === id); if (s) openStaffForm(s); }
function deleteStaff(id) { if (!confirm('Supprimer ?')) return; setData('staff', (getData('staff') || []).filter(s => s.id !== id)); showToast('Supprimé', 'error'); navigateTo('staff'); }

// ===== REVENUE MODULE (Chiffre d'affaires) =====
function renderRevenue() {
    const orders = getData('orders') || [];
    const reservations = getData('reservations') || [];
    const deliveries = getData('deliveries') || [];

    const todayStr = today();
    const monthStr = todayStr.substring(0, 7);
    const yearStr = todayStr.substring(0, 4);

    // CA jour
    const caJourResto = orders.filter(o => o.time && o.time.startsWith(todayStr) && o.paymentStatus === 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const caJourRooms = reservations.filter(r => r.dateIn === todayStr && r.paymentStatus === 'Payé').reduce((s, r) => s + (r.total || 0), 0);
    const caJourLiv = deliveries.filter(d => d.payment === 'Payé').reduce((s, d) => s + (d.deliveryFee || 0), 0);
    const caJour = caJourResto + caJourRooms + caJourLiv;

    // CA mois
    const caMoisResto = orders.filter(o => o.time && o.time.startsWith(monthStr) && o.paymentStatus === 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const caMoisRooms = reservations.filter(r => r.dateIn && r.dateIn.startsWith(monthStr) && r.paymentStatus === 'Payé').reduce((s, r) => s + (r.total || 0), 0);
    const caMoisLiv = deliveries.filter(d => d.payment === 'Payé').reduce((s, d) => s + (d.deliveryFee || 0), 0);
    const caMois = caMoisResto + caMoisRooms + caMoisLiv;

    // CA année
    const caAnneeResto = orders.filter(o => o.time && o.time.startsWith(yearStr) && o.paymentStatus === 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const caAnneeRooms = reservations.filter(r => r.dateIn && r.dateIn.startsWith(yearStr) && r.paymentStatus === 'Payé').reduce((s, r) => s + (r.total || 0), 0);
    const caAnneeLiv = deliveries.filter(d => d.payment === 'Payé').reduce((s, d) => s + (d.deliveryFee || 0), 0);
    const caAnnee = caAnneeResto + caAnneeRooms + caAnneeLiv;

    return `
    <div class="module-header">
        <h3>Chiffre d'affaires</h3>
        <select class="filter-select" id="revenuePeriod" onchange="switchRevenuePeriod(this.value)">
            <option value="jour" selected>Aujourd'hui</option>
            <option value="mois">Ce mois</option>
            <option value="annee">Cette année</option>
        </select>
    </div>

    <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-icon gold"><i class="fas fa-wallet"></i></div><div class="kpi-info"><div class="label">CA Total du jour</div><div class="value">${formatMoney(caJour)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green"><i class="fas fa-utensils"></i></div><div class="kpi-info"><div class="label">Restaurant (jour)</div><div class="value">${formatMoney(caJourResto)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-bed"></i></div><div class="kpi-info"><div class="label">Hébergement (jour)</div><div class="value">${formatMoney(caJourRooms)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange"><i class="fas fa-motorcycle"></i></div><div class="kpi-info"><div class="label">Livraisons (jour)</div><div class="value">${formatMoney(caJourLiv)}</div></div></div>
    </div>

    <div id="revenueDetails">
        <div class="grid-3" style="margin-top:20px">
            <div class="card">
                <div class="card-header"><h3>📅 CA du Jour</h3></div>
                <div class="card-body">
                    <div class="report-summary">
                        <div class="report-item"><div class="value" style="color:var(--gold)">${formatMoney(caJour)}</div><div class="label">Total</div></div>
                        <div class="report-item"><div class="value">${formatMoney(caJourResto)}</div><div class="label">Restaurant</div></div>
                        <div class="report-item"><div class="value">${formatMoney(caJourRooms)}</div><div class="label">Chambres</div></div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>📆 CA du Mois</h3></div>
                <div class="card-body">
                    <div class="report-summary">
                        <div class="report-item"><div class="value" style="color:var(--gold)">${formatMoney(caMois)}</div><div class="label">Total</div></div>
                        <div class="report-item"><div class="value">${formatMoney(caMoisResto)}</div><div class="label">Restaurant</div></div>
                        <div class="report-item"><div class="value">${formatMoney(caMoisRooms)}</div><div class="label">Chambres</div></div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>📊 CA de l'Année</h3></div>
                <div class="card-body">
                    <div class="report-summary">
                        <div class="report-item"><div class="value" style="color:var(--gold)">${formatMoney(caAnnee)}</div><div class="label">Total</div></div>
                        <div class="report-item"><div class="value">${formatMoney(caAnneeResto)}</div><div class="label">Restaurant</div></div>
                        <div class="report-item"><div class="value">${formatMoney(caAnneeRooms)}</div><div class="label">Chambres</div></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="card" style="margin-top:20px">
        <div class="card-header"><h3>📋 Détail des encaissements du jour</h3></div>
        <div class="card-body"><div class="table-container">
            <table><thead><tr><th>Type</th><th>Client</th><th>Description</th><th>Montant</th><th>Paiement</th></tr></thead>
            <tbody>
                ${orders.filter(o => o.time && o.time.startsWith(todayStr) && o.paymentStatus === 'Payé').map(o => `<tr><td><span class="status green">Restaurant</span></td><td>${o.client}</td><td>${o.items.substring(0, 30)}</td><td><strong>${formatMoney(o.amount)}</strong></td><td>${o.payment}</td></tr>`).join('')}
                ${reservations.filter(r => r.dateIn === todayStr && r.paymentStatus === 'Payé').map(r => `<tr><td><span class="status blue">Hébergement</span></td><td>${r.client}</td><td>${r.unit} (${r.nights} nuits)</td><td><strong>${formatMoney(r.total)}</strong></td><td>Payé</td></tr>`).join('')}
                ${orders.filter(o => o.time && o.time.startsWith(todayStr) && o.paymentStatus === 'Payé').length === 0 && reservations.filter(r => r.dateIn === todayStr && r.paymentStatus === 'Payé').length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-gray)">Aucun encaissement aujourd\'hui</td></tr>' : ''}
            </tbody></table>
        </div></div>
    </div>`;
}

function switchRevenuePeriod(period) {
    // Simple re-render for now - the KPI cards show all 3 periods already
    showToast('Vue : ' + (period === 'jour' ? 'Aujourd\'hui' : period === 'mois' ? 'Ce mois' : 'Cette année'));
}

// ===== INVOICES MODULE (Factures) =====
function renderInvoices() {
    const orders = getData('orders') || [];
    const reservations = getData('reservations') || [];
    const invoices = [];
    let num = 1;

    // Générer factures à partir des commandes payées
    orders.filter(o => o.paymentStatus === 'Payé').forEach(o => {
        invoices.push({
            id: 'FAC-' + String(num++).padStart(4, '0'),
            date: o.time ? o.time.split('T')[0] : today(),
            client: o.client,
            type: 'Restaurant',
            description: o.items,
            amount: o.amount,
            payment: o.payment,
            status: 'Payée'
        });
    });

    // Générer factures à partir des réservations payées
    reservations.filter(r => r.paymentStatus === 'Payé').forEach(r => {
        invoices.push({
            id: 'FAC-' + String(num++).padStart(4, '0'),
            date: r.dateIn,
            client: r.client,
            type: 'Hébergement',
            description: `${r.unit} - ${r.nights} nuit(s)`,
            amount: r.total,
            payment: 'Payé',
            status: 'Payée'
        });
    });

    // Factures en attente (non payées)
    orders.filter(o => o.paymentStatus !== 'Payé').forEach(o => {
        invoices.push({
            id: 'FAC-' + String(num++).padStart(4, '0'),
            date: o.time ? o.time.split('T')[0] : today(),
            client: o.client,
            type: 'Restaurant',
            description: o.items,
            amount: o.amount,
            payment: o.payment || 'Non payé',
            status: 'En attente'
        });
    });

    reservations.filter(r => r.paymentStatus !== 'Payé').forEach(r => {
        invoices.push({
            id: 'FAC-' + String(num++).padStart(4, '0'),
            date: r.dateIn,
            client: r.client,
            type: 'Hébergement',
            description: `${r.unit} - ${r.nights} nuit(s)`,
            amount: r.remaining || r.total,
            payment: r.paymentStatus,
            status: 'En attente'
        });
    });

    const totalPaid = invoices.filter(i => i.status === 'Payée').reduce((s, i) => s + (i.amount || 0), 0);
    const totalPending = invoices.filter(i => i.status === 'En attente').reduce((s, i) => s + (i.amount || 0), 0);

    return `
    <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-file-invoice"></i></div><div class="kpi-info"><div class="label">Total factures</div><div class="value">${invoices.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green"><i class="fas fa-check-circle"></i></div><div class="kpi-info"><div class="label">Factures payées</div><div class="value">${formatMoney(totalPaid)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange"><i class="fas fa-clock"></i></div><div class="kpi-info"><div class="label">En attente</div><div class="value">${formatMoney(totalPending)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon gold"><i class="fas fa-receipt"></i></div><div class="kpi-info"><div class="label">Payées ce mois</div><div class="value">${invoices.filter(i => i.status === 'Payée').length}</div></div></div>
    </div>

    <div class="module-header">
        <h3>Liste des factures</h3>
        <div class="btn-group">
            <button class="btn btn-outline btn-sm" onclick="exportInvoicesCSV()"><i class="fas fa-file-csv"></i> Export CSV</button>
            <button class="btn btn-primary btn-sm" onclick="printInvoice()"><i class="fas fa-print"></i> Imprimer</button>
        </div>
    </div>

    <div class="filters-bar">
        <input type="text" class="search-input" placeholder="Rechercher client, n° facture..." onkeyup="filterTable('invoicesTable', this.value)">
        <select class="filter-select" onchange="filterTableByCol('invoicesTable', 5, this.value)">
            <option value="">Tous statuts</option>
            <option value="Payée">Payée</option>
            <option value="En attente">En attente</option>
        </select>
        <select class="filter-select" onchange="filterTableByCol('invoicesTable', 2, this.value)">
            <option value="">Tous types</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Hébergement">Hébergement</option>
        </select>
    </div>

    <div class="card"><div class="table-container">
        <table id="invoicesTable"><thead><tr><th>N° Facture</th><th>Date</th><th>Type</th><th>Client</th><th>Montant</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>${invoices.map(i => `<tr>
            <td><strong>${i.id}</strong></td>
            <td>${formatDate(i.date)}</td>
            <td><span class="status ${i.type === 'Restaurant' ? 'green' : 'blue'}">${i.type}</span></td>
            <td>${i.client}</td>
            <td><strong>${formatMoney(i.amount)}</strong></td>
            <td><span class="status ${i.status === 'Payée' ? 'green' : 'orange'}">${i.status}</span></td>
            <td class="actions-cell">
                <button class="action-btn edit" onclick="viewInvoice('${i.id}', '${i.client}', '${i.description}', ${i.amount}, '${i.date}', '${i.type}', '${i.status}')" title="Voir"><i class="fas fa-eye"></i></button>
            </td>
        </tr>`).join('')}</tbody></table>
        ${invoices.length === 0 ? '<div class="empty-state"><i class="fas fa-file-invoice"></i><p>Aucune facture</p></div>' : ''}
    </div></div>`;
}

function viewInvoice(id, client, desc, amount, date, type, status) {
    const settings = getData('settings') || {};
    openModal('Facture ' + id, `
        <div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid var(--primary)">
            <h2 style="color:var(--primary);margin-bottom:4px">🌴 ${settings.name || 'Le Paradisier'}</h2>
            <p style="font-size:12px;color:var(--text-gray)">${settings.address || 'Toamasina, Madagascar'} | ${settings.phone || ''}</p>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:16px">
            <div><strong>Facture :</strong> ${id}<br><strong>Date :</strong> ${formatDate(date)}</div>
            <div style="text-align:right"><strong>Client :</strong> ${client}<br><strong>Type :</strong> ${type}</div>
        </div>
        <table style="width:100%;margin:16px 0;border-collapse:collapse">
            <thead><tr style="background:var(--ivory)"><th style="padding:10px;text-align:left">Description</th><th style="padding:10px;text-align:right">Montant</th></tr></thead>
            <tbody><tr><td style="padding:10px;border-bottom:1px solid #eee">${desc}</td><td style="padding:10px;text-align:right;border-bottom:1px solid #eee"><strong>${formatMoney(amount)}</strong></td></tr></tbody>
        </table>
        <div style="text-align:right;margin-top:16px;padding-top:12px;border-top:2px solid var(--primary)">
            <div style="font-size:18px;font-weight:700;color:var(--primary)">Total : ${formatMoney(amount)}</div>
            <div style="margin-top:8px"><span class="status ${status === 'Payée' ? 'green' : 'orange'}">${status}</span></div>
        </div>
        <div style="margin-top:20px;text-align:center">
            <button class="btn btn-outline btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Imprimer</button>
        </div>
    `);
}

function exportInvoicesCSV() {
    const orders = getData('orders') || [];
    const reservations = getData('reservations') || [];
    let csv = 'N°,Date,Client,Type,Description,Montant,Statut\n';
    let num = 1;
    orders.filter(o => o.paymentStatus === 'Payé').forEach(o => {
        csv += `FAC-${String(num++).padStart(4,'0')},${o.time ? o.time.split('T')[0] : ''},${o.client},Restaurant,"${o.items}",${o.amount},Payée\n`;
    });
    reservations.filter(r => r.paymentStatus === 'Payé').forEach(r => {
        csv += `FAC-${String(num++).padStart(4,'0')},${r.dateIn},${r.client},Hébergement,"${r.unit} ${r.nights} nuits",${r.total},Payée\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `factures_paradisier_${today()}.csv`;
    link.click();
    showToast('Factures exportées en CSV');
}

function printInvoice() {
    window.print();
}

// ===== REPORTS MODULE =====
function renderReports() {
    const orders = getData('orders') || [];
    const reservations = getData('reservations') || [];
    const expenses = getData('expenses') || [];
    const rooms = getData('rooms') || [];

    const revenueResto = orders.filter(o => o.paymentStatus === 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const revenueRooms = reservations.filter(r => r.paymentStatus === 'Payé').reduce((s, r) => s + (r.total || 0), 0);
    const totalRevenue = revenueResto + revenueRooms;
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;
    const occupied = rooms.filter(r => r.status === 'Occupé').length;
    const occupancy = rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0;

    return `
    <div class="module-header">
        <h3>Rapports</h3>
        <div class="btn-group">
            <button class="btn btn-outline btn-sm" onclick="exportCSV()"><i class="fas fa-file-csv"></i> Export CSV</button>
            <button class="btn btn-outline btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Imprimer</button>
            <button class="btn btn-outline btn-sm" onclick="copyReport()"><i class="fas fa-copy"></i> Copier résumé</button>
        </div>
    </div>

    <div class="card" style="margin-bottom:20px">
        <div class="card-header"><h3>📊 Rapport global</h3></div>
        <div class="card-body">
            <div class="report-summary">
                <div class="report-item"><div class="value">${formatMoney(totalRevenue)}</div><div class="label">Revenus totaux</div></div>
                <div class="report-item"><div class="value" style="color:var(--red)">${formatMoney(totalExpenses)}</div><div class="label">Dépenses totales</div></div>
                <div class="report-item"><div class="value" style="color:${profit>=0?'var(--green)':'var(--red)'}">${formatMoney(profit)}</div><div class="label">Bénéfice net</div></div>
                <div class="report-item"><div class="value">${reservations.length}</div><div class="label">Réservations</div></div>
                <div class="report-item"><div class="value">${orders.length}</div><div class="label">Commandes</div></div>
                <div class="report-item"><div class="value">${occupancy}%</div><div class="label">Taux occupation</div></div>
            </div>
        </div>
    </div>

    <div class="grid-2">
        <div class="card">
            <div class="card-header"><h3>🍽️ Rapport Restaurant</h3></div>
            <div class="card-body">
                <div class="report-summary">
                    <div class="report-item"><div class="value">${orders.length}</div><div class="label">Commandes</div></div>
                    <div class="report-item"><div class="value">${formatMoney(revenueResto)}</div><div class="label">CA Restaurant</div></div>
                    <div class="report-item"><div class="value">${orders.filter(o=>o.status==='Livrée').length}</div><div class="label">Servies</div></div>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🏨 Rapport Hébergement</h3></div>
            <div class="card-body">
                <div class="report-summary">
                    <div class="report-item"><div class="value">${reservations.length}</div><div class="label">Réservations</div></div>
                    <div class="report-item"><div class="value">${formatMoney(revenueRooms)}</div><div class="label">CA Chambres</div></div>
                    <div class="report-item"><div class="value">${occupancy}%</div><div class="label">Occupation</div></div>
                </div>
            </div>
        </div>
    </div>

    <div class="card" style="margin-top:20px">
        <div class="card-header"><h3>💸 Top dépenses</h3></div>
        <div class="card-body"><div class="table-container">
            <table><thead><tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Montant</th></tr></thead>
            <tbody>${expenses.sort((a,b) => (b.amount||0) - (a.amount||0)).slice(0,10).map(e => `<tr><td>${formatDate(e.date)}</td><td>${e.description}</td><td>${e.category}</td><td><strong>${formatMoney(e.amount)}</strong></td></tr>`).join('')}</tbody></table>
        </div></div>
    </div>`;
}

function exportCSV() {
    const orders = getData('orders') || [];
    const reservations = getData('reservations') || [];
    const expenses = getData('expenses') || [];

    let csv = 'Type,Date,Description,Montant,Statut\n';
    orders.forEach(o => { csv += `Commande,${o.time || ''},${o.client} - ${o.items},${o.amount},${o.paymentStatus}\n`; });
    reservations.forEach(r => { csv += `Réservation,${r.dateIn},${r.client} - ${r.unit},${r.total},${r.paymentStatus}\n`; });
    expenses.forEach(e => { csv += `Dépense,${e.date},${e.description},${e.amount},Payé\n`; });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_paradisier_${today()}.csv`;
    link.click();
    showToast('CSV exporté');
}

function copyReport() {
    const orders = getData('orders') || [];
    const reservations = getData('reservations') || [];
    const expenses = getData('expenses') || [];
    const revenueResto = orders.filter(o => o.paymentStatus === 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const revenueRooms = reservations.filter(r => r.paymentStatus === 'Payé').reduce((s, r) => s + (r.total || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const text = `📊 RAPPORT - Le Paradisier\n📅 ${formatDate(today())}\n\n💰 Revenus Restaurant: ${formatMoney(revenueResto)}\n🏨 Revenus Hébergement: ${formatMoney(revenueRooms)}\n📉 Dépenses: ${formatMoney(totalExpenses)}\n✅ Bénéfice: ${formatMoney(revenueResto + revenueRooms - totalExpenses)}\n\n📋 ${orders.length} commandes | ${reservations.length} réservations`;
    navigator.clipboard.writeText(text).then(() => showToast('Résumé copié'));
}

// ===== SETTINGS MODULE =====
function renderSettings() {
    const settings = getData('settings') || {};
    return `
    <div class="card">
        <div class="card-body">
            <div class="settings-section">
                <h4>⚙️ Informations établissement</h4>
                <form onsubmit="saveSettings(event)">
                    <div class="form-row">
                        <div class="form-group"><label>Nom établissement</label><input class="form-control" name="name" value="${settings.name || 'Le Paradisier'}"></div>
                        <div class="form-group"><label>Devise</label><select class="form-control" name="currency"><option ${settings.currency === 'Ar' ? 'selected' : ''}>Ar</option><option ${settings.currency === 'MGA' ? 'selected' : ''}>MGA</option><option ${settings.currency === 'EUR' ? 'selected' : ''}>EUR</option><option ${settings.currency === 'USD' ? 'selected' : ''}>USD</option></select></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Téléphone WhatsApp</label><input class="form-control" name="phone" value="${settings.phone || ''}"></div>
                        <div class="form-group"><label>Adresse</label><input class="form-control" name="address" value="${settings.address || ''}"></div>
                    </div>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Sauvegarder</button>
                </form>
            </div>

            <div class="settings-section">
                <h4>💾 Données</h4>
                <div class="btn-group">
                    <button class="btn btn-outline" onclick="exportAllData()"><i class="fas fa-download"></i> Exporter JSON</button>
                    <button class="btn btn-outline" onclick="document.getElementById('importFile').click()"><i class="fas fa-upload"></i> Importer JSON</button>
                    <button class="btn btn-danger" onclick="resetData()"><i class="fas fa-trash"></i> Réinitialiser démo</button>
                </div>
                <input type="file" id="importFile" accept=".json" style="display:none" onchange="importData(event)">
            </div>

            <div class="settings-section">
                <h4>ℹ️ À propos</h4>
                <p style="color:var(--text-gray);font-size:13px">
                    <strong>Le Paradisier Manager</strong> v1.0<br>
                    Mini logiciel de gestion pour restaurant & appartements meublés.<br>
                    Données sauvegardées localement dans votre navigateur.<br><br>
                    © 2024 Le Paradisier - Tous droits réservés
                </p>
            </div>
        </div>
    </div>`;
}

function saveSettings(e) {
    e.preventDefault();
    const form = e.target;
    const settings = {
        name: form.name.value, currency: form.currency.value,
        phone: form.phone.value, address: form.address.value
    };
    setData('settings', settings);
    showToast('Paramètres sauvegardés');
}

function exportAllData() {
    const data = getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `paradisier_backup_${today()}.json`;
    link.click();
    showToast('Données exportées');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            Object.keys(data).forEach(key => { setData(key, data[key]); });
            showToast('Données importées avec succès');
            navigateTo(currentModule);
        } catch (err) {
            showToast('Erreur lors de l\'import', 'error');
        }
    };
    reader.readAsText(file);
}

function resetData() {
    if (!confirm('Réinitialiser toutes les données avec les données de démonstration ?')) return;
    const keys = ['reservations', 'rooms', 'orders', 'deliveries', 'clients', 'stock', 'expenses', 'staff', 'settings', 'initialized'];
    keys.forEach(k => localStorage.removeItem('paradisier_' + k));
    loadDemoData();
    showToast('Données réinitialisées');
    navigateTo('dashboard');
}

// ===== HELPER: TABLE FILTER =====
function filterTable(tableId, query) {
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    query = query.toLowerCase();
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

function filterTableByCol(tableId, colIndex, value) {
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    rows.forEach(row => {
        if (!value) { row.style.display = ''; return; }
        const cell = row.cells[colIndex];
        row.style.display = cell && cell.textContent.includes(value) ? '' : 'none';
    });
}

// ===== APP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
    // Load demo data if first time
    loadDemoData();

    // Set today's date
    document.getElementById('todayDate').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo(this.dataset.module);
        });
    });

    // Menu toggle (mobile)
    document.getElementById('menuToggle').addEventListener('click', function () {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', function (e) {
        if (e.target === this) closeModal();
    });

    // Keyboard escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });

    // Render dashboard
    navigateTo('dashboard');
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
}
