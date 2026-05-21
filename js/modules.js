/* ============================================
   LE PARADISIER MANAGER - Modules de Rendu
   Version locale hors-ligne
   ============================================ */

// ===== DASHBOARD =====
async function renderDashboard(container) {
    const [orders, reservations, expenses, rooms, stock, staff] = await Promise.all([
        LocalStorage.getAll('orders'),
        LocalStorage.getAll('reservations'),
        LocalStorage.getAll('expenses'),
        LocalStorage.getAll('rooms'),
        LocalStorage.getAll('stock'),
        LocalStorage.getAll('staff')
    ]);
    
    const todayStr = today();
    const todayOrders = orders.filter(o => o.time?.startsWith(todayStr) || o.date?.startsWith(todayStr));
    const todayExpenses = expenses.filter(e => e.date === todayStr);
    
    const revenueToday = todayOrders.filter(o => o.paymentStatus === 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    const expenseToday = todayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const profit = revenueToday - expenseToday;
    
    const activeRes = reservations.filter(r => r.status === 'Confirmée' || r.dateIn === todayStr);
    const occupied = rooms.filter(r => r.status === 'Occupé').length;
    const totalRooms = rooms.length;
    const occupancy = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;
    
    const pendingPayments = reservations.filter(r => r.paymentStatus !== 'Payé').reduce((s, r) => s + (r.remaining || 0), 0)
        + orders.filter(o => o.paymentStatus !== 'Payé').reduce((s, o) => s + (o.amount || 0), 0);
    
    const criticalStock = stock.filter(s => s.status === 'Critique' || s.quantity <= s.threshold);
    const presentStaff = staff.filter(s => s.status === 'Présent');
    
    container.innerHTML = `
    <div class="kpi-grid">
        <div class="kpi-card kpi-ca-card">
            <div class="kpi-icon gold"><i class="fas fa-cash-register"></i></div>
            <div class="kpi-info">
                <div class="label">Revenus du jour</div>
                <div class="value">${formatMoney(revenueToday)}</div>
                <div class="trend up"><i class="fas fa-utensils"></i> ${todayOrders.length} commande(s)</div>
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
                <div class="trend ${profit >= 0 ? 'up' : 'down'}">
                    <i class="fas fa-${profit >= 0 ? 'arrow-up' : 'arrow-down'}"></i> ${profit >= 0 ? 'Positif' : 'Négatif'}
                </div>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-icon blue"><i class="fas fa-calendar-check"></i></div>
            <div class="kpi-info">
                <div class="label">Réservations actives</div>
                <div class="value">${activeRes.length}</div>
                <div class="trend up"><i class="fas fa-bed"></i> En cours</div>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-icon green"><i class="fas fa-chart-pie"></i></div>
            <div class="kpi-info">
                <div class="label">Taux d'occupation</div>
                <div class="value">${occupancy}%</div>
                <div class="trend ${occupancy > 50 ? 'up' : 'down'}">
                    <i class="fas fa-building"></i> ${occupied}/${totalRooms} unités
                </div>
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
            <div class="card-header"><h3>⚠️ Alertes</h3></div>
            <div class="card-body">
                ${criticalStock.length > 0 ? criticalStock.map(s => 
                    `<div class="alert-item danger"><i class="fas fa-exclamation-triangle"></i> Stock critique : ${escapeHtml(s.product)}</div>`
                ).join('') : ''}
                ${pendingPayments > 0 ? `<div class="alert-item warning"><i class="fas fa-clock"></i> ${formatMoney(pendingPayments)} en attente</div>` : ''}
                ${rooms.filter(r => r.status === 'Maintenance').length > 0 ? 
                    `<div class="alert-item info"><i class="fas fa-tools"></i> ${rooms.filter(r => r.status === 'Maintenance').length} unité(s) en maintenance</div>` : ''}
                ${criticalStock.length === 0 && pendingPayments === 0 ? 
                    '<div class="alert-item info"><i class="fas fa-check"></i> Aucune alerte</div>' : ''}
            </div>
        </div>
    </div>
    
    <div class="grid-3">
        <div class="card">
            <div class="card-header"><h3>🍽️ Commandes récentes</h3></div>
            <div class="card-body">
                <ul class="widget-list">
                    ${todayOrders.slice(0, 5).map(o => `
                        <li>
                            <span>${escapeHtml(o.client)} - ${escapeHtml(o.items?.substring(0, 25) || '')}...</span>
                            <span class="status ${o.status === 'Livrée' ? 'green' : o.status === 'En préparation' ? 'orange' : 'blue'}">${o.status}</span>
                        </li>
                    `).join('')}
                    ${todayOrders.length === 0 ? '<li>Aucune commande aujourd\'hui</li>' : ''}
                </ul>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>👥 Personnel présent</h3></div>
            <div class="card-body">
                <ul class="widget-list">
                    ${presentStaff.slice(0, 5).map(s => `
                        <li>
                            <span><strong>${escapeHtml(s.name)}</strong> - ${escapeHtml(s.position)}</span>
                            <span class="status green">Présent</span>
                        </li>
                    `).join('')}
                    ${presentStaff.length === 0 ? '<li>Aucun personnel présent</li>' : ''}
                </ul>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🏨 Chambres disponibles</h3></div>
            <div class="card-body">
                <ul class="widget-list">
                    ${rooms.filter(r => r.status === 'Disponible').slice(0, 5).map(r => `
                        <li>
                            <span>${escapeHtml(r.name)}</span>
                            <span class="status green">${formatMoney(r.price)}/nuit</span>
                        </li>
                    `).join('')}
                    ${rooms.filter(r => r.status === 'Disponible').length === 0 ? '<li>Aucune chambre disponible</li>' : ''}
                </ul>
            </div>
        </div>
    </div>`;
    
    // Initialiser le graphique
    await initDashboardChart(orders);
}

async function initDashboardChart(orders) {
    const ctx = document.getElementById('chartRevenue')?.getContext('2d');
    if (!ctx) return;
    
    // Données des 7 derniers jours
    const labels = [];
    const revenues = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = daysAgo(i);
        labels.push(new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
        
        const dayOrders = orders.filter(o => 
            (o.time?.startsWith(date) || o.date?.startsWith(date)) && o.paymentStatus === 'Payé'
        );
        revenues.push(dayOrders.reduce((s, o) => s + (o.amount || 0), 0));
    }
    
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Revenus',
                data: revenues,
                borderColor: '#12A150',
                backgroundColor: 'rgba(18, 161, 80, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => (v/1000) + 'k' } }
            }
        }
    });
}

// ===== CLIENTS =====
async function renderClients(container) {
    const clients = await LocalStorage.getAll('clients');
    
    container.innerHTML = `
    <div class="module-header">
        <h3>${clients.length} client(s)</h3>
        <button class="btn btn-primary" onclick="showClientForm()">
            <i class="fas fa-plus"></i> Nouveau client
        </button>
    </div>
    <div class="card">
        <div class="card-body">
            <div class="filters-bar">
                <input type="text" class="search-input" id="clientSearch" placeholder="Rechercher..." oninput="filterClients()">
                <select class="filter-select" id="clientTypeFilter" onchange="filterClients()">
                    <option value="">Tous les types</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Appartement">Appartement</option>
                    <option value="Les deux">Les deux</option>
                </select>
            </div>
            <div class="table-container">
                <table id="clientsTable">
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
                        ${clients.map(c => renderClientRow(c)).join('')}
                        ${clients.length === 0 ? '<tr><td colspan="6" class="empty-state">Aucun client</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function renderClientRow(c) {
    return `
    <tr data-id="${c.id}" data-name="${escapeHtml(c.name?.toLowerCase() || '')}" data-type="${c.type || ''}">
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>${escapeHtml(c.phone || '-')}</td>
        <td>${escapeHtml(c.type || '-')}</td>
        <td><span class="status ${c.status === 'VIP' ? 'gold' : c.status === 'Fidèle' ? 'green' : 'blue'}">${c.status || 'Nouveau'}</span></td>
        <td>${formatMoney(c.totalSpent || 0)}</td>
        <td class="actions-cell">
            <button class="action-btn edit" onclick="showClientForm('${c.id}')" title="Modifier">
                <i class="fas fa-pen"></i>
            </button>
            <button class="action-btn delete" onclick="deleteClient('${c.id}')" title="Supprimer">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    </tr>`;
}

function filterClients() {
    const search = document.getElementById('clientSearch').value.toLowerCase();
    const type = document.getElementById('clientTypeFilter').value;
    
    document.querySelectorAll('#clientsTable tbody tr').forEach(row => {
        const name = row.dataset.name || '';
        const rowType = row.dataset.type || '';
        
        const matchSearch = name.includes(search);
        const matchType = !type || rowType === type;
        
        row.style.display = matchSearch && matchType ? '' : 'none';
    });
}

async function showClientForm(id = null) {
    let client = { name: '', phone: '', email: '', type: 'Les deux', status: 'Nouveau', notes: '' };
    
    if (id) {
        client = await LocalStorage.get('clients', id) || client;
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
            await LocalStorage.update('clients', id, data);
            showToast('Client modifié');
        } else {
            await LocalStorage.add('clients', data);
            showToast('Client créé');
        }
        closeModal();
        navigateTo('clients');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteClient(id) {
    const confirmed = await confirmDelete('Supprimer le client ?', 'Cette action est irréversible.');
    if (!confirmed) return;
    
    const client = await LocalStorage.get('clients', id);
    saveForUndo('client', client);
    
    await LocalStorage.delete('clients', id);
    showToast('Client supprimé');
    navigateTo('clients');
}

// ===== ROOMS =====
async function renderRooms(container) {
    const rooms = await LocalStorage.getAll('rooms');
    
    container.innerHTML = `
    <div class="module-header">
        <h3>${rooms.length} chambre(s) / appartement(s)</h3>
        <button class="btn btn-primary" onclick="showRoomForm()">
            <i class="fas fa-plus"></i> Ajouter
        </button>
    </div>
    <div class="rooms-grid">
        ${rooms.map(r => `
            <div class="room-card" onclick="showRoomForm('${r.id}')">
                <div class="room-name">${escapeHtml(r.name)}</div>
                <div class="room-type">${escapeHtml(r.type)} • ${r.capacity || 2} pers.</div>
                <div class="room-price">${formatMoney(r.price || r.pricePerNight)}/nuit</div>
                <span class="status ${r.status === 'Disponible' ? 'green' : r.status === 'Occupé' ? 'red' : 'orange'}">${r.status}</span>
            </div>
        `).join('')}
        ${rooms.length === 0 ? '<div class="empty-state"><i class="fas fa-bed"></i><p>Aucune chambre</p></div>' : ''}
    </div>`;
}

async function showRoomForm(id = null) {
    let room = { name: '', type: 'Chambre', capacity: 2, price: 150000, status: 'Disponible', description: '' };
    
    if (id) {
        room = await LocalStorage.get('rooms', id) || room;
    }
    
    openModal(id ? 'Modifier' : 'Nouvelle chambre', `
        <form id="roomForm" onsubmit="saveRoom(event, '${id || ''}')">
            <div class="form-group">
                <label>Nom *</label>
                <input type="text" class="form-control" name="name" value="${escapeHtml(room.name)}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Type</label>
                    <select class="form-control" name="type">
                        <option value="Chambre" ${room.type === 'Chambre' ? 'selected' : ''}>Chambre</option>
                        <option value="Appartement" ${room.type === 'Appartement' ? 'selected' : ''}>Appartement</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Capacité</label>
                    <input type="number" class="form-control" name="capacity" value="${room.capacity}" min="1">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Prix / nuit (${settings.currency})</label>
                    <input type="number" class="form-control" name="price" value="${room.price || room.pricePerNight}" min="0">
                </div>
                <div class="form-group">
                    <label>Statut</label>
                    <select class="form-control" name="status">
                        <option value="Disponible" ${room.status === 'Disponible' ? 'selected' : ''}>Disponible</option>
                        <option value="Occupé" ${room.status === 'Occupé' ? 'selected' : ''}>Occupé</option>
                        <option value="Nettoyage" ${room.status === 'Nettoyage' ? 'selected' : ''}>Nettoyage</option>
                        <option value="Maintenance" ${room.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" name="description">${escapeHtml(room.description || '')}</textarea>
            </div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
                ${id ? `<button type="button" class="btn btn-danger" onclick="deleteRoom('${id}')"><i class="fas fa-trash"></i> Supprimer</button>` : ''}
                <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        </form>
    `);
}

async function saveRoom(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);
    data.price = parseInt(data.price) || 0;
    data.capacity = parseInt(data.capacity) || 2;
    
    try {
        if (id) {
            await LocalStorage.update('rooms', id, data);
            showToast('Chambre modifiée');
        } else {
            await LocalStorage.add('rooms', data);
            showToast('Chambre créée');
        }
        closeModal();
        navigateTo('rooms');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteRoom(id) {
    const confirmed = await confirmDelete('Supprimer cette chambre ?', 'Cette action est irréversible.');
    if (!confirmed) return;
    
    await LocalStorage.delete('rooms', id);
    showToast('Chambre supprimée');
    closeModal();
    navigateTo('rooms');
}

// Export global des fonctions
window.renderDashboard = renderDashboard;
window.renderClients = renderClients;
window.showClientForm = showClientForm;
window.saveClient = saveClient;
window.deleteClient = deleteClient;
window.filterClients = filterClients;
window.renderRooms = renderRooms;
window.showRoomForm = showRoomForm;
window.saveRoom = saveRoom;
window.deleteRoom = deleteRoom;
