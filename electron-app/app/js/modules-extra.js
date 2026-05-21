/* ============================================
   LE PARADISIER MANAGER - Modules Extra
   Restaurant, Stock, Dépenses, Comptabilité, Personnel
   ============================================ */

// ===== RESTAURANT =====
async function renderRestaurant(container) {
    const orders = await LocalStorage.getAll('orders');
    const todayOrders = orders.filter(o => (o.time || o.date || '').startsWith(today()));
    
    container.innerHTML = `
    <div class="module-header">
        <h3>${todayOrders.length} commande(s) aujourd'hui</h3>
        <button class="btn btn-primary" onclick="showOrderForm()">
            <i class="fas fa-plus"></i> Nouvelle commande
        </button>
    </div>
    <div class="card"><div class="card-body">
        <div class="table-container">
            <table>
                <thead><tr>
                    <th>N°</th><th>Client</th><th>Type</th>
                    <th>Articles</th><th>Montant</th><th>Statut</th><th>Actions</th>
                </tr></thead>
                <tbody>
                    ${todayOrders.map(o => `
                        <tr>
                            <td>${escapeHtml(o.id)}</td>
                            <td>${escapeHtml(o.client)}</td>
                            <td>${escapeHtml(o.type)}</td>
                            <td>${escapeHtml((o.items || '').substring(0, 30))}...</td>
                            <td>${formatMoney(o.amount)}</td>
                            <td><span class="status ${o.status === 'Livrée' ? 'green' : 'orange'}">${o.status}</span></td>
                            <td class="actions-cell">
                                <button class="action-btn edit" onclick="showOrderForm('${o.id}')"><i class="fas fa-pen"></i></button>
                                <button class="action-btn delete" onclick="deleteOrder('${o.id}')"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                    ${todayOrders.length === 0 ? '<tr><td colspan="7" class="empty-state">Aucune commande</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    </div></div>`;
}



async function showOrderForm(id = null) {
    let order = { client: '', phone: '', type: 'Sur place', items: '', amount: 0, payment: 'Espèces', paymentStatus: 'En attente', status: 'À préparer' };
    if (id) order = await LocalStorage.get('orders', id) || order;
    
    openModal(id ? 'Modifier' : 'Nouvelle commande', `
        <form id="orderForm" onsubmit="saveOrder(event, '${id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Client *</label>
                    <input type="text" class="form-control" name="client" value="${escapeHtml(order.client)}" required>
                </div>
                <div class="form-group"><label>Téléphone</label>
                    <input type="text" class="form-control" name="phone" value="${escapeHtml(order.phone || '')}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Type</label>
                    <select class="form-control" name="type">
                        <option value="Sur place" ${order.type === 'Sur place' ? 'selected' : ''}>Sur place</option>
                        <option value="À emporter" ${order.type === 'À emporter' ? 'selected' : ''}>À emporter</option>
                        <option value="Livraison" ${order.type === 'Livraison' ? 'selected' : ''}>Livraison</option>
                    </select>
                </div>
                <div class="form-group"><label>Montant (${settings.currency})</label>
                    <input type="number" class="form-control" name="amount" value="${order.amount}" min="0">
                </div>
            </div>
            <div class="form-group"><label>Articles *</label>
                <textarea class="form-control" name="items" required>${escapeHtml(order.items)}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Paiement</label>
                    <select class="form-control" name="payment">
                        <option value="Espèces" ${order.payment === 'Espèces' ? 'selected' : ''}>Espèces</option>
                        <option value="MVola" ${order.payment === 'MVola' ? 'selected' : ''}>MVola</option>
                        <option value="Carte" ${order.payment === 'Carte' ? 'selected' : ''}>Carte</option>
                    </select>
                </div>
                <div class="form-group"><label>Statut paiement</label>
                    <select class="form-control" name="paymentStatus">
                        <option value="En attente" ${order.paymentStatus === 'En attente' ? 'selected' : ''}>En attente</option>
                        <option value="Payé" ${order.paymentStatus === 'Payé' ? 'selected' : ''}>Payé</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Statut commande</label>
                <select class="form-control" name="status">
                    <option value="À préparer" ${order.status === 'À préparer' ? 'selected' : ''}>À préparer</option>
                    <option value="En préparation" ${order.status === 'En préparation' ? 'selected' : ''}>En préparation</option>
                    <option value="Prête" ${order.status === 'Prête' ? 'selected' : ''}>Prête</option>
                    <option value="Livrée" ${order.status === 'Livrée' ? 'selected' : ''}>Livrée</option>
                </select>
            </div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        </form>
    `);
}



async function saveOrder(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);
    data.amount = parseInt(data.amount) || 0;
    data.time = data.time || new Date().toISOString();
    data.date = today();
    
    try {
        if (id) { await LocalStorage.update('orders', id, data); showToast('Commande modifiée'); }
        else { await LocalStorage.add('orders', data); showToast('Commande créée'); }
        closeModal();
        navigateTo('restaurant');
    } catch (error) { showToast(error.message, 'error'); }
}

async function deleteOrder(id) {
    if (!await confirmDelete('Supprimer cette commande ?', 'Cette action est irréversible.')) return;
    await LocalStorage.delete('orders', id);
    showToast('Commande supprimée');
    navigateTo('restaurant');
}

// ===== LIVRAISONS =====
async function renderDeliveries(container) {
    const deliveries = await LocalStorage.getAll('deliveries');
    container.innerHTML = `
    <div class="module-header">
        <h3>${deliveries.length} livraison(s)</h3>
        <button class="btn btn-primary" onclick="showDeliveryForm()"><i class="fas fa-plus"></i> Nouvelle</button>
    </div>
    <div class="card"><div class="card-body">
        <div class="table-container">
            <table><thead><tr><th>Client</th><th>Adresse</th><th>Livreur</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
                ${deliveries.map(d => `<tr>
                    <td>${escapeHtml(d.client)}</td><td>${escapeHtml(d.address)}</td>
                    <td>${escapeHtml(d.driver)}</td><td>${formatMoney(d.total)}</td>
                    <td><span class="status ${d.status === 'Livrée' ? 'green' : 'orange'}">${d.status}</span></td>
                    <td class="actions-cell">
                        <button class="action-btn edit" onclick="showDeliveryForm('${d.id}')"><i class="fas fa-pen"></i></button>
                        <button class="action-btn delete" onclick="deleteDelivery('${d.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('')}
                ${deliveries.length === 0 ? '<tr><td colspan="6" class="empty-state">Aucune livraison</td></tr>' : ''}
            </tbody></table>
        </div>
    </div></div>`;
}

async function showDeliveryForm(id = null) {
    let d = { client: '', phone: '', address: '', driver: '', deliveryFee: 15000, total: 0, status: 'En attente' };
    if (id) d = await LocalStorage.get('deliveries', id) || d;
    
    openModal(id ? 'Modifier' : 'Nouvelle livraison', `
        <form id="deliveryForm" onsubmit="saveDelivery(event, '${id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Client *</label><input type="text" class="form-control" name="client" value="${escapeHtml(d.client)}" required></div>
                <div class="form-group"><label>Téléphone</label><input type="text" class="form-control" name="phone" value="${escapeHtml(d.phone || '')}"></div>
            </div>
            <div class="form-group"><label>Adresse *</label><input type="text" class="form-control" name="address" value="${escapeHtml(d.address)}" required></div>
            <div class="form-row">
                <div class="form-group"><label>Livreur</label><input type="text" class="form-control" name="driver" value="${escapeHtml(d.driver || '')}"></div>
                <div class="form-group"><label>Frais livraison</label><input type="number" class="form-control" name="deliveryFee" value="${d.deliveryFee}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Total</label><input type="number" class="form-control" name="total" value="${d.total}"></div>
                <div class="form-group"><label>Statut</label>
                    <select class="form-control" name="status">
                        <option value="En attente" ${d.status === 'En attente' ? 'selected' : ''}>En attente</option>
                        <option value="En route" ${d.status === 'En route' ? 'selected' : ''}>En route</option>
                        <option value="Livrée" ${d.status === 'Livrée' ? 'selected' : ''}>Livrée</option>
                    </select>
                </div>
            </div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        </form>
    `);
}

async function saveDelivery(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);
    data.deliveryFee = parseInt(data.deliveryFee) || 0;
    data.total = parseInt(data.total) || 0;
    
    if (id) { await LocalStorage.update('deliveries', id, data); showToast('Livraison modifiée'); }
    else { await LocalStorage.add('deliveries', data); showToast('Livraison créée'); }
    closeModal();
    navigateTo('deliveries');
}

async function deleteDelivery(id) {
    if (!await confirmDelete('Supprimer ?', 'Action irréversible.')) return;
    await LocalStorage.delete('deliveries', id);
    showToast('Livraison supprimée');
    navigateTo('deliveries');
}



// ===== STOCK =====
async function renderStock(container) {
    const stock = await LocalStorage.getAll('stock');
    const critical = stock.filter(s => s.quantity <= (s.threshold || 0));
    
    container.innerHTML = `
    <div class="module-header">
        <h3>${stock.length} article(s) • ${critical.length} en alerte</h3>
        <button class="btn btn-primary" onclick="showStockForm()"><i class="fas fa-plus"></i> Ajouter</button>
    </div>
    <div class="card"><div class="card-body">
        <div class="table-container">
            <table><thead><tr><th>Produit</th><th>Catégorie</th><th>Quantité</th><th>Seuil</th><th>Valeur</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
                ${stock.map(s => {
                    const status = s.quantity <= (s.threshold || 0) ? 'Critique' : s.quantity <= (s.threshold || 0) * 1.5 ? 'Faible' : 'OK';
                    return `<tr>
                        <td><strong>${escapeHtml(s.product)}</strong></td>
                        <td>${escapeHtml(s.category)}</td>
                        <td>${s.quantity} ${escapeHtml(s.unit || '')}</td>
                        <td>${s.threshold || 0}</td>
                        <td>${formatMoney(s.value || (s.quantity * (s.buyPrice || 0)))}</td>
                        <td><span class="status ${status === 'Critique' ? 'red' : status === 'Faible' ? 'orange' : 'green'}">${status}</span></td>
                        <td class="actions-cell">
                            <button class="action-btn edit" onclick="showStockForm('${s.id}')"><i class="fas fa-pen"></i></button>
                            <button class="action-btn delete" onclick="deleteStock('${s.id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`;
                }).join('')}
                ${stock.length === 0 ? '<tr><td colspan="7" class="empty-state">Aucun article</td></tr>' : ''}
            </tbody></table>
        </div>
    </div></div>`;
}

async function showStockForm(id = null) {
    let s = { product: '', category: 'Cuisine', quantity: 0, unit: 'pièce', threshold: 5, buyPrice: 0 };
    if (id) s = await LocalStorage.get('stock', id) || s;
    
    openModal(id ? 'Modifier' : 'Nouvel article', `
        <form id="stockForm" onsubmit="saveStock(event, '${id || ''}')">
            <div class="form-group"><label>Produit *</label><input type="text" class="form-control" name="product" value="${escapeHtml(s.product)}" required></div>
            <div class="form-row">
                <div class="form-group"><label>Catégorie</label>
                    <select class="form-control" name="category">
                        <option value="Cuisine" ${s.category === 'Cuisine' ? 'selected' : ''}>Cuisine</option>
                        <option value="Boissons" ${s.category === 'Boissons' ? 'selected' : ''}>Boissons</option>
                        <option value="Nettoyage" ${s.category === 'Nettoyage' ? 'selected' : ''}>Nettoyage</option>
                        <option value="Chambre" ${s.category === 'Chambre' ? 'selected' : ''}>Chambre</option>
                        <option value="Autre" ${s.category === 'Autre' ? 'selected' : ''}>Autre</option>
                    </select>
                </div>
                <div class="form-group"><label>Unité</label><input type="text" class="form-control" name="unit" value="${escapeHtml(s.unit || 'pièce')}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Quantité</label><input type="number" class="form-control" name="quantity" value="${s.quantity}" min="0"></div>
                <div class="form-group"><label>Seuil alerte</label><input type="number" class="form-control" name="threshold" value="${s.threshold}" min="0"></div>
            </div>
            <div class="form-group"><label>Prix d'achat unitaire</label><input type="number" class="form-control" name="buyPrice" value="${s.buyPrice}" min="0"></div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        </form>
    `);
}

async function saveStock(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);
    data.quantity = parseInt(data.quantity) || 0;
    data.threshold = parseInt(data.threshold) || 0;
    data.buyPrice = parseInt(data.buyPrice) || 0;
    data.value = data.quantity * data.buyPrice;
    
    if (id) { await LocalStorage.update('stock', id, data); showToast('Stock modifié'); }
    else { await LocalStorage.add('stock', data); showToast('Article ajouté'); }
    closeModal();
    navigateTo('stock');
}

async function deleteStock(id) {
    if (!await confirmDelete('Supprimer cet article ?', 'Action irréversible.')) return;
    await LocalStorage.delete('stock', id);
    showToast('Article supprimé');
    navigateTo('stock');
}



// ===== DÉPENSES =====
async function renderExpenses(container) {
    const expenses = await LocalStorage.getAll('expenses');
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    
    container.innerHTML = `
    <div class="module-header">
        <h3>${expenses.length} dépense(s) • Total: ${formatMoney(total)}</h3>
        <button class="btn btn-primary" onclick="showExpenseForm()"><i class="fas fa-plus"></i> Ajouter</button>
    </div>
    <div class="card"><div class="card-body">
        <div class="table-container">
            <table><thead><tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Montant</th><th>Paiement</th><th>Actions</th></tr></thead>
            <tbody>
                ${expenses.sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => `<tr>
                    <td>${formatDate(e.date)}</td>
                    <td>${escapeHtml(e.description)}</td>
                    <td>${escapeHtml(e.category)}</td>
                    <td class="text-red">${formatMoney(e.amount)}</td>
                    <td>${escapeHtml(e.payment)}</td>
                    <td class="actions-cell">
                        <button class="action-btn edit" onclick="showExpenseForm('${e.id}')"><i class="fas fa-pen"></i></button>
                        <button class="action-btn delete" onclick="deleteExpense('${e.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('')}
                ${expenses.length === 0 ? '<tr><td colspan="6" class="empty-state">Aucune dépense</td></tr>' : ''}
            </tbody></table>
        </div>
    </div></div>`;
}

async function showExpenseForm(id = null) {
    let e = { date: today(), description: '', category: 'Achats restaurant', amount: 0, payment: 'Espèces' };
    if (id) e = await LocalStorage.get('expenses', id) || e;
    
    openModal(id ? 'Modifier' : 'Nouvelle dépense', `
        <form id="expenseForm" onsubmit="saveExpense(event, '${id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" class="form-control" name="date" value="${e.date}"></div>
                <div class="form-group"><label>Montant (${settings.currency})</label><input type="number" class="form-control" name="amount" value="${e.amount}" min="0" required></div>
            </div>
            <div class="form-group"><label>Description *</label><input type="text" class="form-control" name="description" value="${escapeHtml(e.description)}" required></div>
            <div class="form-row">
                <div class="form-group"><label>Catégorie</label>
                    <select class="form-control" name="category">
                        <option value="Achats restaurant" ${e.category === 'Achats restaurant' ? 'selected' : ''}>Achats restaurant</option>
                        <option value="Salaires" ${e.category === 'Salaires' ? 'selected' : ''}>Salaires</option>
                        <option value="Électricité" ${e.category === 'Électricité' ? 'selected' : ''}>Électricité</option>
                        <option value="Eau" ${e.category === 'Eau' ? 'selected' : ''}>Eau</option>
                        <option value="Internet" ${e.category === 'Internet' ? 'selected' : ''}>Internet</option>
                        <option value="Maintenance" ${e.category === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                        <option value="Marketing" ${e.category === 'Marketing' ? 'selected' : ''}>Marketing</option>
                        <option value="Autre" ${e.category === 'Autre' ? 'selected' : ''}>Autre</option>
                    </select>
                </div>
                <div class="form-group"><label>Paiement</label>
                    <select class="form-control" name="payment">
                        <option value="Espèces" ${e.payment === 'Espèces' ? 'selected' : ''}>Espèces</option>
                        <option value="MVola" ${e.payment === 'MVola' ? 'selected' : ''}>MVola</option>
                        <option value="Virement" ${e.payment === 'Virement' ? 'selected' : ''}>Virement</option>
                    </select>
                </div>
            </div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        </form>
    `);
}

async function saveExpense(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);
    data.amount = parseInt(data.amount) || 0;
    
    if (id) { await LocalStorage.update('expenses', id, data); showToast('Dépense modifiée'); }
    else { await LocalStorage.add('expenses', data); showToast('Dépense ajoutée'); }
    closeModal();
    navigateTo('expenses');
}

async function deleteExpense(id) {
    if (!await confirmDelete('Supprimer cette dépense ?', 'Action irréversible.')) return;
    await LocalStorage.delete('expenses', id);
    showToast('Dépense supprimée');
    navigateTo('expenses');
}



// ===== COMPTABILITÉ =====
async function renderAccounting(container) {
    const accounting = await LocalStorage.getAll('accounting');
    const revenues = accounting.filter(a => a.type === 'Revenu');
    const expenses = accounting.filter(a => a.type === 'Dépense');
    const totalRevenue = revenues.reduce((s, r) => s + (r.amount || 0), 0);
    const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const profit = totalRevenue - totalExpense;
    
    container.innerHTML = `
    <div class="kpi-grid acc-kpi-grid">
        <div class="kpi-card acc-kpi-green"><div class="kpi-icon green"><i class="fas fa-arrow-up"></i></div>
            <div class="kpi-info"><div class="label">Revenus</div><div class="value">${formatMoney(totalRevenue)}</div></div></div>
        <div class="kpi-card acc-kpi-red"><div class="kpi-icon red"><i class="fas fa-arrow-down"></i></div>
            <div class="kpi-info"><div class="label">Dépenses</div><div class="value">${formatMoney(totalExpense)}</div></div></div>
        <div class="kpi-card acc-kpi-gold"><div class="kpi-icon gold"><i class="fas fa-coins"></i></div>
            <div class="kpi-info"><div class="label">Bénéfice</div><div class="value">${formatMoney(profit)}</div></div></div>
    </div>
    <div class="module-header">
        <h3>${accounting.length} transaction(s)</h3>
        <button class="btn btn-primary" onclick="showAccountingForm()"><i class="fas fa-plus"></i> Nouvelle</button>
    </div>
    <div class="card"><div class="card-body">
        <div class="table-container">
            <table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Source</th><th>Montant</th><th>Actions</th></tr></thead>
            <tbody>
                ${accounting.sort((a,b) => new Date(b.date) - new Date(a.date)).map(a => `<tr>
                    <td>${formatDate(a.date)}</td>
                    <td><span class="status ${a.type === 'Revenu' ? 'green' : 'red'}">${a.type}</span></td>
                    <td>${escapeHtml(a.description)}</td>
                    <td>${escapeHtml(a.source)}</td>
                    <td style="color: ${a.type === 'Revenu' ? 'var(--green)' : 'var(--red)'}">${a.type === 'Revenu' ? '+' : '-'}${formatMoney(a.amount)}</td>
                    <td class="actions-cell">
                        <button class="action-btn edit" onclick="showAccountingForm('${a.id}')"><i class="fas fa-pen"></i></button>
                        <button class="action-btn delete" onclick="deleteAccounting('${a.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('')}
                ${accounting.length === 0 ? '<tr><td colspan="6" class="empty-state">Aucune transaction</td></tr>' : ''}
            </tbody></table>
        </div>
    </div></div>`;
}

async function showAccountingForm(id = null) {
    let a = { date: today(), type: 'Revenu', description: '', source: 'Restaurant', amount: 0, payment: 'Espèces', status: 'Payé' };
    if (id) a = await LocalStorage.get('accounting', id) || a;
    
    openModal(id ? 'Modifier' : 'Nouvelle transaction', `
        <form id="accountingForm" onsubmit="saveAccounting(event, '${id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" class="form-control" name="date" value="${a.date}"></div>
                <div class="form-group"><label>Type</label>
                    <select class="form-control" name="type">
                        <option value="Revenu" ${a.type === 'Revenu' ? 'selected' : ''}>Revenu</option>
                        <option value="Dépense" ${a.type === 'Dépense' ? 'selected' : ''}>Dépense</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Description *</label><input type="text" class="form-control" name="description" value="${escapeHtml(a.description)}" required></div>
            <div class="form-row">
                <div class="form-group"><label>Source</label>
                    <select class="form-control" name="source">
                        <option value="Restaurant" ${a.source === 'Restaurant' ? 'selected' : ''}>Restaurant</option>
                        <option value="Appartements" ${a.source === 'Appartements' ? 'selected' : ''}>Appartements</option>
                        <option value="Chambres" ${a.source === 'Chambres' ? 'selected' : ''}>Chambres</option>
                        <option value="Livraison" ${a.source === 'Livraison' ? 'selected' : ''}>Livraison</option>
                        <option value="Stock" ${a.source === 'Stock' ? 'selected' : ''}>Stock</option>
                        <option value="Salaire" ${a.source === 'Salaire' ? 'selected' : ''}>Salaire</option>
                        <option value="Maintenance" ${a.source === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                        <option value="Autre" ${a.source === 'Autre' ? 'selected' : ''}>Autre</option>
                    </select>
                </div>
                <div class="form-group"><label>Montant</label><input type="number" class="form-control" name="amount" value="${a.amount}" min="0" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Paiement</label>
                    <select class="form-control" name="payment">
                        <option value="Espèces" ${a.payment === 'Espèces' ? 'selected' : ''}>Espèces</option>
                        <option value="Mobile Money" ${a.payment === 'Mobile Money' ? 'selected' : ''}>Mobile Money</option>
                        <option value="Virement" ${a.payment === 'Virement' ? 'selected' : ''}>Virement</option>
                    </select>
                </div>
                <div class="form-group"><label>Statut</label>
                    <select class="form-control" name="status">
                        <option value="Payé" ${a.status === 'Payé' ? 'selected' : ''}>Payé</option>
                        <option value="En attente" ${a.status === 'En attente' ? 'selected' : ''}>En attente</option>
                    </select>
                </div>
            </div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        </form>
    `);
}

async function saveAccounting(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);
    data.amount = parseInt(data.amount) || 0;
    
    if (id) { await LocalStorage.update('accounting', id, data); showToast('Transaction modifiée'); }
    else { await LocalStorage.add('accounting', data); showToast('Transaction ajoutée'); }
    closeModal();
    navigateTo('accounting');
}

async function deleteAccounting(id) {
    if (!await confirmDelete('Supprimer cette transaction ?', 'Action irréversible.')) return;
    await LocalStorage.delete('accounting', id);
    showToast('Transaction supprimée');
    navigateTo('accounting');
}



// ===== PERSONNEL =====
async function renderStaff(container) {
    const staff = await LocalStorage.getAll('staff');
    const present = staff.filter(s => s.status === 'Présent').length;
    
    container.innerHTML = `
    <div class="module-header">
        <h3>${staff.length} employé(s) • ${present} présent(s)</h3>
        <button class="btn btn-primary" onclick="showStaffForm()"><i class="fas fa-plus"></i> Ajouter</button>
    </div>
    <div class="card"><div class="card-body">
        <div class="table-container">
            <table><thead><tr><th>Nom</th><th>Poste</th><th>Téléphone</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
                ${staff.map(s => `<tr>
                    <td><strong>${escapeHtml(s.name)}</strong></td>
                    <td>${escapeHtml(s.position)}</td>
                    <td>${escapeHtml(s.phone || '-')}</td>
                    <td><span class="status ${s.status === 'Présent' ? 'green' : 'red'}">${s.status}</span></td>
                    <td class="actions-cell">
                        <button class="action-btn edit" onclick="showStaffForm('${s.id}')"><i class="fas fa-pen"></i></button>
                        <button class="action-btn delete" onclick="deleteStaff('${s.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('')}
                ${staff.length === 0 ? '<tr><td colspan="5" class="empty-state">Aucun employé</td></tr>' : ''}
            </tbody></table>
        </div>
    </div></div>`;
}

async function showStaffForm(id = null) {
    let s = { name: '', position: 'Serveur', phone: '', status: 'Présent', shift: 'Journée' };
    if (id) s = await LocalStorage.get('staff', id) || s;
    
    openModal(id ? 'Modifier' : 'Nouvel employé', `
        <form id="staffForm" onsubmit="saveStaff(event, '${id || ''}')">
            <div class="form-group"><label>Nom *</label><input type="text" class="form-control" name="name" value="${escapeHtml(s.name)}" required></div>
            <div class="form-row">
                <div class="form-group"><label>Poste</label>
                    <select class="form-control" name="position">
                        <option value="Cuisine" ${s.position === 'Cuisine' ? 'selected' : ''}>Cuisine</option>
                        <option value="Serveur" ${s.position === 'Serveur' ? 'selected' : ''}>Serveur</option>
                        <option value="Livreur" ${s.position === 'Livreur' ? 'selected' : ''}>Livreur</option>
                        <option value="Réception" ${s.position === 'Réception' ? 'selected' : ''}>Réception</option>
                        <option value="Ménage" ${s.position === 'Ménage' ? 'selected' : ''}>Ménage</option>
                        <option value="Manager" ${s.position === 'Manager' ? 'selected' : ''}>Manager</option>
                    </select>
                </div>
                <div class="form-group"><label>Téléphone</label><input type="text" class="form-control" name="phone" value="${escapeHtml(s.phone || '')}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Statut</label>
                    <select class="form-control" name="status">
                        <option value="Présent" ${s.status === 'Présent' ? 'selected' : ''}>Présent</option>
                        <option value="Absent" ${s.status === 'Absent' ? 'selected' : ''}>Absent</option>
                        <option value="Congé" ${s.status === 'Congé' ? 'selected' : ''}>Congé</option>
                    </select>
                </div>
                <div class="form-group"><label>Horaire</label>
                    <select class="form-control" name="shift">
                        <option value="Matin" ${s.shift === 'Matin' ? 'selected' : ''}>Matin</option>
                        <option value="Soir" ${s.shift === 'Soir' ? 'selected' : ''}>Soir</option>
                        <option value="Journée" ${s.shift === 'Journée' ? 'selected' : ''}>Journée</option>
                    </select>
                </div>
            </div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        </form>
    `);
}

async function saveStaff(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);
    
    if (id) { await LocalStorage.update('staff', id, data); showToast('Employé modifié'); }
    else { await LocalStorage.add('staff', data); showToast('Employé ajouté'); }
    closeModal();
    navigateTo('staff');
}

async function deleteStaff(id) {
    if (!await confirmDelete('Supprimer cet employé ?', 'Action irréversible.')) return;
    await LocalStorage.delete('staff', id);
    showToast('Employé supprimé');
    navigateTo('staff');
}

// ===== RÉSERVATIONS =====
async function renderReservations(container) {
    const reservations = await LocalStorage.getAll('reservations');
    
    container.innerHTML = `
    <div class="module-header">
        <h3>${reservations.length} réservation(s)</h3>
        <button class="btn btn-primary" onclick="showReservationForm()"><i class="fas fa-plus"></i> Nouvelle</button>
    </div>
    <div class="card"><div class="card-body">
        <div class="table-container">
            <table><thead><tr><th>N°</th><th>Client</th><th>Chambre</th><th>Dates</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
                ${reservations.map(r => `<tr>
                    <td>${escapeHtml(r.id)}</td>
                    <td>${escapeHtml(r.client)}</td>
                    <td>${escapeHtml(r.unit || r.room)}</td>
                    <td>${formatDate(r.dateIn)} → ${formatDate(r.dateOut)}</td>
                    <td>${formatMoney(r.total)}</td>
                    <td><span class="status ${r.status === 'Confirmée' ? 'green' : r.status === 'Annulée' ? 'red' : 'orange'}">${r.status}</span></td>
                    <td class="actions-cell">
                        <button class="action-btn edit" onclick="showReservationForm('${r.id}')"><i class="fas fa-pen"></i></button>
                        <button class="action-btn delete" onclick="deleteReservation('${r.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('')}
                ${reservations.length === 0 ? '<tr><td colspan="7" class="empty-state">Aucune réservation</td></tr>' : ''}
            </tbody></table>
        </div>
    </div></div>`;
}

async function showReservationForm(id = null) {
    const rooms = await LocalStorage.getAll('rooms');
    let r = { client: '', phone: '', unit: '', dateIn: today(), dateOut: '', nights: 1, pricePerNight: 0, total: 0, deposit: 0, status: 'En attente', paymentStatus: 'En attente' };
    if (id) r = await LocalStorage.get('reservations', id) || r;
    
    openModal(id ? 'Modifier' : 'Nouvelle réservation', `
        <form id="reservationForm" onsubmit="saveReservation(event, '${id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Client *</label><input type="text" class="form-control" name="client" value="${escapeHtml(r.client)}" required></div>
                <div class="form-group"><label>Téléphone</label><input type="text" class="form-control" name="phone" value="${escapeHtml(r.phone || '')}"></div>
            </div>
            <div class="form-group"><label>Chambre / Appartement</label>
                <select class="form-control" name="unit">
                    ${rooms.map(rm => `<option value="${escapeHtml(rm.name)}" ${r.unit === rm.name ? 'selected' : ''}>${escapeHtml(rm.name)} - ${formatMoney(rm.price)}/nuit</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Arrivée</label><input type="date" class="form-control" name="dateIn" value="${r.dateIn}"></div>
                <div class="form-group"><label>Départ</label><input type="date" class="form-control" name="dateOut" value="${r.dateOut}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Prix/nuit</label><input type="number" class="form-control" name="pricePerNight" value="${r.pricePerNight}" min="0"></div>
                <div class="form-group"><label>Total</label><input type="number" class="form-control" name="total" value="${r.total}" min="0"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Acompte versé</label><input type="number" class="form-control" name="deposit" value="${r.deposit}" min="0"></div>
                <div class="form-group"><label>Statut</label>
                    <select class="form-control" name="status">
                        <option value="En attente" ${r.status === 'En attente' ? 'selected' : ''}>En attente</option>
                        <option value="Confirmée" ${r.status === 'Confirmée' ? 'selected' : ''}>Confirmée</option>
                        <option value="Annulée" ${r.status === 'Annulée' ? 'selected' : ''}>Annulée</option>
                    </select>
                </div>
            </div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        </form>
    `);
}

async function saveReservation(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);
    data.pricePerNight = parseInt(data.pricePerNight) || 0;
    data.total = parseInt(data.total) || 0;
    data.deposit = parseInt(data.deposit) || 0;
    data.remaining = data.total - data.deposit;
    data.paymentStatus = data.deposit >= data.total ? 'Payé' : data.deposit > 0 ? 'Acompte' : 'En attente';
    
    if (id) { await LocalStorage.update('reservations', id, data); showToast('Réservation modifiée'); }
    else { await LocalStorage.add('reservations', data); showToast('Réservation créée'); }
    closeModal();
    navigateTo('reservations');
}

async function deleteReservation(id) {
    if (!await confirmDelete('Supprimer cette réservation ?', 'Action irréversible.')) return;
    await LocalStorage.delete('reservations', id);
    showToast('Réservation supprimée');
    navigateTo('reservations');
}

// ===== FACTURES =====
async function renderInvoices(container) {
    const invoices = await LocalStorage.getAll('invoices');
    container.innerHTML = `
    <div class="module-header">
        <h3>${invoices.length} facture(s)</h3>
        <button class="btn btn-primary" onclick="showInvoiceForm()"><i class="fas fa-plus"></i> Nouvelle</button>
    </div>
    <div class="card"><div class="card-body">
        <div class="table-container">
            <table><thead><tr><th>N°</th><th>Client</th><th>Date</th><th>Montant</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
                ${invoices.map(i => `<tr>
                    <td>${escapeHtml(i.id)}</td>
                    <td>${escapeHtml(i.client)}</td>
                    <td>${formatDate(i.date)}</td>
                    <td>${formatMoney(i.amount)}</td>
                    <td><span class="status ${i.status === 'Payée' ? 'green' : 'orange'}">${i.status}</span></td>
                    <td class="actions-cell">
                        <button class="action-btn edit" onclick="showInvoiceForm('${i.id}')"><i class="fas fa-pen"></i></button>
                        <button class="action-btn delete" onclick="deleteInvoice('${i.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('')}
                ${invoices.length === 0 ? '<tr><td colspan="6" class="empty-state">Aucune facture</td></tr>' : ''}
            </tbody></table>
        </div>
    </div></div>`;
}

async function showInvoiceForm(id = null) {
    let inv = { client: '', date: today(), description: '', amount: 0, status: 'En attente' };
    if (id) inv = await LocalStorage.get('invoices', id) || inv;
    
    openModal(id ? 'Modifier' : 'Nouvelle facture', `
        <form id="invoiceForm" onsubmit="saveInvoice(event, '${id || ''}')">
            <div class="form-row">
                <div class="form-group"><label>Client *</label><input type="text" class="form-control" name="client" value="${escapeHtml(inv.client)}" required></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-control" name="date" value="${inv.date}"></div>
            </div>
            <div class="form-group"><label>Description</label><textarea class="form-control" name="description">${escapeHtml(inv.description || '')}</textarea></div>
            <div class="form-row">
                <div class="form-group"><label>Montant</label><input type="number" class="form-control" name="amount" value="${inv.amount}" min="0" required></div>
                <div class="form-group"><label>Statut</label>
                    <select class="form-control" name="status">
                        <option value="En attente" ${inv.status === 'En attente' ? 'selected' : ''}>En attente</option>
                        <option value="Payée" ${inv.status === 'Payée' ? 'selected' : ''}>Payée</option>
                    </select>
                </div>
            </div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        </form>
    `);
}

async function saveInvoice(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);
    data.amount = parseInt(data.amount) || 0;
    
    if (id) { await LocalStorage.update('invoices', id, data); showToast('Facture modifiée'); }
    else { await LocalStorage.add('invoices', data); showToast('Facture créée'); }
    closeModal();
    navigateTo('invoices');
}

async function deleteInvoice(id) {
    if (!await confirmDelete('Supprimer ?', 'Action irréversible.')) return;
    await LocalStorage.delete('invoices', id);
    showToast('Facture supprimée');
    navigateTo('invoices');
}

// Export global
window.renderRestaurant = renderRestaurant;
window.showOrderForm = showOrderForm;
window.saveOrder = saveOrder;
window.deleteOrder = deleteOrder;
window.renderDeliveries = renderDeliveries;
window.showDeliveryForm = showDeliveryForm;
window.saveDelivery = saveDelivery;
window.deleteDelivery = deleteDelivery;
window.renderStock = renderStock;
window.showStockForm = showStockForm;
window.saveStock = saveStock;
window.deleteStock = deleteStock;
window.renderExpenses = renderExpenses;
window.showExpenseForm = showExpenseForm;
window.saveExpense = saveExpense;
window.deleteExpense = deleteExpense;
window.renderAccounting = renderAccounting;
window.showAccountingForm = showAccountingForm;
window.saveAccounting = saveAccounting;
window.deleteAccounting = deleteAccounting;
window.renderStaff = renderStaff;
window.showStaffForm = showStaffForm;
window.saveStaff = saveStaff;
window.deleteStaff = deleteStaff;
window.renderReservations = renderReservations;
window.showReservationForm = showReservationForm;
window.saveReservation = saveReservation;
window.deleteReservation = deleteReservation;
window.renderInvoices = renderInvoices;
window.showInvoiceForm = showInvoiceForm;
window.saveInvoice = saveInvoice;
window.deleteInvoice = deleteInvoice;
