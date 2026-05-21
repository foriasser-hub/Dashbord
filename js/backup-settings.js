/* ============================================
   LE PARADISIER MANAGER - Sauvegarde & Paramètres
   ============================================ */

// ===== PAGE SAUVEGARDE =====
async function renderBackup(container) {
    const data = await LocalStorage.exportAll();
    const totalItems = Object.values(data.collections).reduce((s, arr) => s + arr.length, 0);
    
    container.innerHTML = `
    <div class="grid-2">
        <div class="card">
            <div class="card-header"><h3><i class="fas fa-download"></i> Exporter les données</h3></div>
            <div class="card-body">
                <p style="margin-bottom: 16px; color: var(--text-gray);">
                    Téléchargez une copie de toutes vos données au format JSON.<br>
                    <strong>${totalItems} éléments</strong> dans ${Object.keys(data.collections).length} collections.
                </p>
                <button class="btn btn-primary" onclick="exportData()">
                    <i class="fas fa-file-export"></i> Télécharger la sauvegarde
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header"><h3><i class="fas fa-upload"></i> Importer / Restaurer</h3></div>
            <div class="card-body">
                <p style="margin-bottom: 16px; color: var(--text-gray);">
                    Restaurez vos données depuis un fichier de sauvegarde.<br>
                    <span style="color: var(--red);">⚠️ Cette action remplacera toutes les données actuelles.</span>
                </p>
                <input type="file" id="importFile" accept=".json" style="display:none" onchange="importData(event)">
                <button class="btn btn-outline" onclick="document.getElementById('importFile').click()">
                    <i class="fas fa-file-import"></i> Choisir un fichier
                </button>
            </div>
        </div>
    </div>
    
    <div class="card" style="margin-top: 20px;">
        <div class="card-header"><h3><i class="fas fa-trash-alt"></i> Réinitialiser</h3></div>
        <div class="card-body">
            <p style="margin-bottom: 16px; color: var(--text-gray);">
                Supprimez toutes les données et recommencez à zéro avec les données de démonstration.
            </p>
            <div class="btn-group">
                <button class="btn btn-danger" onclick="resetAllData()">
                    <i class="fas fa-exclamation-triangle"></i> Réinitialiser tout
                </button>
                <button class="btn btn-outline" onclick="loadDemoDataForce()">
                    <i class="fas fa-sync"></i> Recharger les données démo
                </button>
            </div>
        </div>
    </div>
    
    <div class="card" style="margin-top: 20px;">
        <div class="card-header"><h3><i class="fas fa-info-circle"></i> Informations</h3></div>
        <div class="card-body">
            <div class="report-summary">
                ${Object.entries(data.collections).map(([name, items]) => `
                    <div class="report-item">
                        <div class="value">${items.length}</div>
                        <div class="label">${name}</div>
                    </div>
                `).join('')}
            </div>
            <p style="font-size: 12px; color: var(--text-gray); margin-top: 12px;">
                Dernière sauvegarde possible : ${new Date().toLocaleString('fr-FR')}
            </p>
        </div>
    </div>`;
}

async function exportData() {
    try {
        const data = await LocalStorage.exportAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `paradisier-backup-${today()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Sauvegarde téléchargée !');
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const confirmed = await confirmDelete(
        'Restaurer les données ?',
        'Toutes les données actuelles seront remplacées par le contenu du fichier.'
    );
    
    if (!confirmed) {
        event.target.value = '';
        return;
    }
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.collections) {
            throw new Error('Format de fichier invalide');
        }
        
        await LocalStorage.importAll(data);
        showToast('Données restaurées avec succès !');
        
        // Recharger l'application
        setTimeout(() => window.location.reload(), 1000);
        
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
    
    event.target.value = '';
}



async function resetAllData() {
    const confirmed = await confirmDelete(
        'Réinitialiser TOUTES les données ?',
        'Cette action est IRRÉVERSIBLE. Toutes vos données seront supprimées.'
    );
    
    if (!confirmed) return;
    
    // Double confirmation
    if (!confirm('Êtes-vous VRAIMENT sûr ? Tapez OK pour confirmer.')) return;
    
    try {
        // Vider toutes les collections
        for (const store of LocalStorage.STORES) {
            await LocalStorage.clear(store);
        }
        
        // Supprimer aussi localStorage
        const keys = Object.keys(localStorage).filter(k => k.startsWith('paradisier_'));
        keys.forEach(k => localStorage.removeItem(k));
        
        showToast('Données réinitialisées');
        setTimeout(() => window.location.reload(), 1000);
        
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

async function loadDemoDataForce() {
    const confirmed = await confirmDelete(
        'Charger les données de démonstration ?',
        'Les données existantes seront fusionnées avec les données de démo.'
    );
    
    if (!confirmed) return;
    
    await loadDemoDataIfEmpty(true);
    showToast('Données de démonstration chargées');
    navigateTo('dashboard');
}

// ===== PAGE PARAMÈTRES =====
async function renderSettings(container) {
    const settingsData = await LocalStorage.getAll('settings');
    const config = settingsData.find(s => s.id === 'app_settings') || APP_CONFIG.defaults;
    
    container.innerHTML = `
    <div class="grid-2">
        <div class="card">
            <div class="card-header"><h3><i class="fas fa-building"></i> Établissement</h3></div>
            <div class="card-body">
                <form id="settingsForm" onsubmit="saveSettings(event)">
                    <div class="form-group">
                        <label>Nom de l'établissement</label>
                        <input type="text" class="form-control" name="establishmentName" 
                               value="${escapeHtml(config.establishmentName || '')}" required>
                    </div>
                    <div class="form-group">
                        <label>Logo (emoji)</label>
                        <input type="text" class="form-control" name="logo" 
                               value="${escapeHtml(config.logo || '🌴')}" maxlength="4">
                        <small style="color: var(--text-gray);">Ex: 🌴 🏨 🍽️ 🏠</small>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Téléphone</label>
                            <input type="text" class="form-control" name="phone" 
                                   value="${escapeHtml(config.phone || '')}">
                        </div>
                        <div class="form-group">
                            <label>Devise</label>
                            <select class="form-control" name="currency">
                                <option value="Ar" ${config.currency === 'Ar' ? 'selected' : ''}>Ariary (Ar)</option>
                                <option value="€" ${config.currency === '€' ? 'selected' : ''}>Euro (€)</option>
                                <option value="$" ${config.currency === '$' ? 'selected' : ''}>Dollar ($)</option>
                                <option value="FCFA" ${config.currency === 'FCFA' ? 'selected' : ''}>FCFA</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Adresse</label>
                        <textarea class="form-control" name="address">${escapeHtml(config.address || '')}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Enregistrer
                    </button>
                </form>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header"><h3><i class="fas fa-lock"></i> Sécurité</h3></div>
            <div class="card-body">
                <form id="passwordForm" onsubmit="changePassword(event)">
                    <div class="form-group">
                        <label>Mot de passe actuel</label>
                        <input type="password" class="form-control" id="currentPwd" required>
                    </div>
                    <div class="form-group">
                        <label>Nouveau mot de passe</label>
                        <input type="password" class="form-control" id="newPwd" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label>Confirmer</label>
                        <input type="password" class="form-control" id="confirmPwd" required>
                    </div>
                    <div id="pwdError" class="login-error" style="display:none"></div>
                    <button type="submit" class="btn btn-outline">
                        <i class="fas fa-key"></i> Changer le mot de passe
                    </button>
                </form>
            </div>
        </div>
    </div>
    
    <div class="card" style="margin-top: 20px;">
        <div class="card-header"><h3><i class="fas fa-info-circle"></i> À propos</h3></div>
        <div class="card-body">
            <p><strong>${APP_CONFIG.name}</strong></p>
            <p>Version ${APP_CONFIG.version} • Application locale hors-ligne</p>
            <p style="margin-top: 12px; font-size: 13px; color: var(--text-gray);">
                Cette application fonctionne entièrement hors-ligne.<br>
                Vos données sont stockées localement dans votre navigateur.<br>
                Pensez à faire des sauvegardes régulières !
            </p>
            <div style="margin-top: 16px;">
                <button class="btn btn-sm btn-outline" onclick="navigateTo('backup')">
                    <i class="fas fa-cloud-arrow-down"></i> Sauvegarde & Restauration
                </button>
            </div>
        </div>
    </div>`;
}

async function saveSettings(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);
    
    try {
        await LocalStorage.update('settings', 'app_settings', data);
        settings = { ...settings, ...data };
        showToast('Paramètres enregistrés');
        
        // Mettre à jour le sidebar
        const logoEl = document.querySelector('.logo-icon');
        const nameEl = document.querySelector('.logo-text h1');
        if (logoEl) logoEl.textContent = data.logo || '🌴';
        if (nameEl) nameEl.textContent = data.establishmentName || 'Le Paradisier';
        
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

async function changePassword(e) {
    e.preventDefault();
    
    const errorDiv = document.getElementById('pwdError');
    const currentPwd = document.getElementById('currentPwd').value;
    const newPwd = document.getElementById('newPwd').value;
    const confirmPwd = document.getElementById('confirmPwd').value;
    
    errorDiv.style.display = 'none';
    
    if (newPwd !== confirmPwd) {
        errorDiv.textContent = 'Les mots de passe ne correspondent pas';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPwd.length < 6) {
        errorDiv.textContent = 'Minimum 6 caractères';
        errorDiv.style.display = 'block';
        return;
    }
    
    const result = await LocalAuth.changePassword(currentPwd, newPwd);
    
    if (result.success) {
        showToast('Mot de passe modifié');
        document.getElementById('passwordForm').reset();
    } else {
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
    }
}

// ===== DONNÉES DE DÉMONSTRATION =====
async function loadDemoDataIfEmpty(force = false) {
    const clients = await LocalStorage.getAll('clients');
    
    if (clients.length > 0 && !force) return;
    
    // Clients
    const demoClients = [
        { name: 'Rindra Rakotomalala', phone: '+261 34 12 345 67', type: 'Les deux', status: 'VIP', totalSpent: 4850000 },
        { name: 'Haja Andrianaivo', phone: '+261 32 98 765 43', type: 'Restaurant', status: 'Fidèle', totalSpent: 1560000 },
        { name: 'Volatiana Rasoamanana', phone: '+261 33 45 678 90', type: 'Appartement', status: 'Fidèle', totalSpent: 3200000 },
        { name: 'Niry Randriamahefa', phone: '+261 34 33 221 10', type: 'Restaurant', status: 'Nouveau', totalSpent: 675000 },
        { name: 'Zo Rabemananjara', phone: '+261 32 55 443 32', type: 'Les deux', status: 'VIP', totalSpent: 7200000 }
    ];
    
    // Chambres
    const demoRooms = [
        { name: 'Appartement 1A', type: 'Appartement', capacity: 4, price: 450000, status: 'Occupé' },
        { name: 'Appartement 2B', type: 'Appartement', capacity: 2, price: 350000, status: 'Disponible' },
        { name: 'Appartement 3C', type: 'Appartement', capacity: 3, price: 400000, status: 'Nettoyage' },
        { name: 'Chambre Deluxe 01', type: 'Chambre', capacity: 2, price: 250000, status: 'Occupé' },
        { name: 'Chambre Standard 05', type: 'Chambre', capacity: 2, price: 150000, status: 'Disponible' },
        { name: 'Chambre Deluxe 02', type: 'Chambre', capacity: 2, price: 250000, status: 'Maintenance' }
    ];
    
    // Commandes
    const demoOrders = [
        { client: 'Haja Andrianaivo', type: 'Sur place', items: 'Romazava, Vary, Jus de goyave', amount: 85000, paymentStatus: 'Payé', status: 'Livrée', date: today() },
        { client: 'Niry Randriamahefa', type: 'À emporter', items: 'Poisson grillé, Mofo gasy, Boisson', amount: 120000, paymentStatus: 'Payé', status: 'Prête', date: today() },
        { client: 'Rindra Rakotomalala', type: 'Livraison', items: 'Crevettes sautées, Vary x2, Litchis', amount: 220000, paymentStatus: 'En attente', status: 'En préparation', date: today() }
    ];
    
    // Stock
    const demoStock = [
        { product: 'Poulet fermier', category: 'Cuisine', quantity: 8, unit: 'kg', threshold: 5, buyPrice: 35000 },
        { product: 'Tomates', category: 'Cuisine', quantity: 3, unit: 'kg', threshold: 5, buyPrice: 12000 },
        { product: 'Vary (riz) 5kg', category: 'Cuisine', quantity: 12, unit: 'paquet', threshold: 4, buyPrice: 40000 },
        { product: 'Jus de goyave', category: 'Boissons', quantity: 2, unit: 'paquet', threshold: 5, buyPrice: 60000 },
        { product: 'Draps', category: 'Chambre', quantity: 1, unit: 'pièce', threshold: 6, buyPrice: 150000 }
    ];
    
    // Personnel
    const demoStaff = [
        { name: 'Tsiry Rakoto', position: 'Livreur', phone: '+261 34 11 223 34', status: 'Présent', shift: 'Journée' },
        { name: 'Sahondra Razafindrakoto', position: 'Cuisine', phone: '+261 32 22 334 45', status: 'Présent', shift: 'Matin' },
        { name: 'Faniry Andria', position: 'Livreur', phone: '+261 33 44 556 67', status: 'Présent', shift: 'Soir' },
        { name: 'Miora Rakotondrabe', position: 'Réception', phone: '+261 34 33 445 56', status: 'Présent', shift: 'Journée' }
    ];
    
    // Dépenses
    const demoExpenses = [
        { date: today(), description: 'Achat produits alimentaires', category: 'Achats restaurant', amount: 450000, payment: 'Espèces' },
        { date: daysAgo(1), description: 'Salaire personnel (acompte)', category: 'Salaires', amount: 1500000, payment: 'MVola' },
        { date: daysAgo(2), description: 'Facture électricité JIRAMA', category: 'Électricité', amount: 850000, payment: 'MVola' }
    ];
    
    // Insérer les données
    for (const c of demoClients) await LocalStorage.add('clients', c);
    for (const r of demoRooms) await LocalStorage.add('rooms', r);
    for (const o of demoOrders) await LocalStorage.add('orders', o);
    for (const s of demoStock) await LocalStorage.add('stock', s);
    for (const st of demoStaff) await LocalStorage.add('staff', st);
    for (const e of demoExpenses) await LocalStorage.add('expenses', e);
    
    console.log('Données de démonstration chargées');
}

// Export global
window.renderBackup = renderBackup;
window.exportData = exportData;
window.importData = importData;
window.resetAllData = resetAllData;
window.loadDemoDataForce = loadDemoDataForce;
window.renderSettings = renderSettings;
window.saveSettings = saveSettings;
window.changePassword = changePassword;
window.loadDemoDataIfEmpty = loadDemoDataIfEmpty;
