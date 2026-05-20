// ===========================================
// LE PARADISIER MANAGER - Migration des données
// Importe les données localStorage vers la base
// ===========================================

const DataMigration = {
  
  // Récupérer les données du localStorage
  getLocalData(key) {
    try {
      const data = localStorage.getItem('paradisier_' + key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Erreur lecture localStorage:', key, e);
      return [];
    }
  },
  
  // Vérifier s'il y a des données à migrer
  hasDataToMigrate() {
    const keys = ['clients', 'rooms', 'reservations', 'orders', 'stock', 'expenses'];
    for (const key of keys) {
      const data = this.getLocalData(key);
      if (data && data.length > 0) return true;
    }
    return false;
  },
  
  // Obtenir le résumé des données locales
  getLocalDataSummary() {
    return {
      clients: this.getLocalData('clients').length,
      rooms: this.getLocalData('rooms').length,
      reservations: this.getLocalData('reservations').length,
      orders: this.getLocalData('orders').length,
      stock: this.getLocalData('stock').length,
      expenses: this.getLocalData('expenses').length
    };
  },
  
  // Migrer toutes les données
  async migrateAll(progressCallback) {
    const results = {
      success: true,
      migrated: {},
      errors: []
    };
    
    try {
      // 1. Migrer les clients
      progressCallback?.('Migration des clients...');
      results.migrated.clients = await this.migrateClients();
      
      // 2. Migrer les chambres
      progressCallback?.('Migration des chambres...');
      results.migrated.rooms = await this.migrateRooms();
      
      // 3. Migrer le stock
      progressCallback?.('Migration du stock...');
      results.migrated.stock = await this.migrateStock();
      
      // 4. Migrer les dépenses
      progressCallback?.('Migration des dépenses...');
      results.migrated.expenses = await this.migrateExpenses();
      
      // 5. Migrer les réservations
      progressCallback?.('Migration des réservations...');
      results.migrated.reservations = await this.migrateReservations();
      
      // 6. Migrer les commandes
      progressCallback?.('Migration des commandes...');
      results.migrated.orders = await this.migrateOrders();
      
      progressCallback?.('Migration terminée!');
      
    } catch (error) {
      results.success = false;
      results.errors.push(error.message);
    }
    
    return results;
  },
  
  // Migration des clients
  async migrateClients() {
    const localClients = this.getLocalData('clients');
    let migrated = 0;
    
    for (const client of localClients) {
      try {
        await API.clients.create({
          name: client.name,
          phone: client.phone,
          email: client.email,
          type: client.type || 'Les deux',
          status: client.status || 'Nouveau',
          notes: client.notes
        });
        migrated++;
      } catch (e) {
        console.warn('Erreur migration client:', client.name, e);
      }
    }
    
    return migrated;
  },
  
  // Migration des chambres
  async migrateRooms() {
    const localRooms = this.getLocalData('rooms');
    let migrated = 0;
    
    for (const room of localRooms) {
      try {
        await API.rooms.create({
          name: room.name,
          type: room.type || 'Chambre',
          capacity: room.capacity || 2,
          price_per_night: room.price || room.pricePerNight || 0,
          status: room.status || 'Disponible',
          floor: room.floor,
          description: room.description,
          equipment: room.equipment
        });
        migrated++;
      } catch (e) {
        console.warn('Erreur migration chambre:', room.name, e);
      }
    }
    
    return migrated;
  },
  
  // Migration du stock
  async migrateStock() {
    const localStock = this.getLocalData('stock');
    let migrated = 0;
    
    for (const item of localStock) {
      try {
        await API.stock.create({
          name: item.product || item.name,
          category: item.category || 'Autre',
          quantity: item.quantity || 0,
          unit: item.unit || 'pièce',
          min_quantity: item.threshold || item.minQuantity || 0,
          purchase_price: item.buyPrice || item.purchasePrice || 0,
          supplier: item.supplier,
          notes: item.notes
        });
        migrated++;
      } catch (e) {
        console.warn('Erreur migration stock:', item.product, e);
      }
    }
    
    return migrated;
  },
  
  // Migration des dépenses
  async migrateExpenses() {
    const localExpenses = this.getLocalData('expenses');
    let migrated = 0;
    
    for (const expense of localExpenses) {
      try {
        await API.expenses.create({
          date: expense.date || new Date().toISOString().split('T')[0],
          category: this.mapExpenseCategory(expense.category),
          description: expense.description,
          supplier: expense.supplier,
          amount: expense.amount || 0,
          payment_method: expense.payment || expense.paymentMethod,
          reference: expense.reference,
          notes: expense.note || expense.notes
        });
        migrated++;
      } catch (e) {
        console.warn('Erreur migration dépense:', expense.description, e);
      }
    }
    
    return migrated;
  },
  
  // Mapper les catégories de dépenses
  mapExpenseCategory(category) {
    const mapping = {
      'Achats restaurant': 'Achats restaurant',
      'Salaires': 'Salaires',
      'Électricité': 'Électricité',
      'Eau': 'Eau',
      'Internet': 'Internet',
      'Maintenance': 'Maintenance',
      'Marketing': 'Marketing',
      'Transport': 'Transport',
      'Loyer': 'Loyer',
      'Impôts': 'Impôts'
    };
    return mapping[category] || 'Autre';
  },
  
  // Migration des réservations (nécessite clients et chambres migrés)
  async migrateReservations() {
    const localReservations = this.getLocalData('reservations');
    let migrated = 0;
    
    // Récupérer les chambres créées
    const roomsResult = await API.rooms.list();
    const rooms = roomsResult.data || [];
    
    for (const res of localReservations) {
      try {
        // Trouver la chambre correspondante
        const room = rooms.find(r => r.name === res.unit);
        if (!room) {
          console.warn('Chambre non trouvée pour réservation:', res.unit);
          continue;
        }
        
        await API.reservations.create({
          room_id: room.id,
          check_in: res.dateIn,
          check_out: res.dateOut,
          price_per_night: res.pricePerNight || room.price_per_night,
          total_amount: res.total || (res.nights * res.pricePerNight),
          paid_amount: res.deposit || 0,
          notes: res.note || res.notes
        });
        migrated++;
      } catch (e) {
        console.warn('Erreur migration réservation:', res.id, e);
      }
    }
    
    return migrated;
  },
  
  // Migration des commandes restaurant
  async migrateOrders() {
    const localOrders = this.getLocalData('orders');
    let migrated = 0;
    
    for (const order of localOrders) {
      try {
        await API.restaurant.create({
          client_name: order.client,
          client_phone: order.phone,
          order_type: order.type || 'Sur place',
          items: [{ name: order.items, quantity: 1 }],
          items_text: order.items,
          total_amount: order.amount || 0,
          paid_amount: order.paymentStatus === 'Payé' ? order.amount : 0,
          payment_method: order.payment,
          notes: order.note
        });
        migrated++;
      } catch (e) {
        console.warn('Erreur migration commande:', order.id, e);
      }
    }
    
    return migrated;
  },
  
  // Nettoyer le localStorage après migration réussie
  clearLocalData() {
    const keys = ['clients', 'rooms', 'reservations', 'orders', 'deliveries', 
                  'stock', 'expenses', 'staff', 'accounting', 'settings', 'initialized'];
    keys.forEach(key => localStorage.removeItem('paradisier_' + key));
  },
  
  // Afficher le formulaire de migration
  showMigrationModal() {
    const summary = this.getLocalDataSummary();
    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
      showToast('Aucune donnée locale à migrer', 'info');
      return;
    }
    
    openModal('Importer les données locales', `
      <div style="text-align:center; padding:20px;">
        <i class="fas fa-database fa-3x" style="color:#C99A2E; margin-bottom:15px;"></i>
        <h4>Données trouvées dans le navigateur:</h4>
        <ul style="text-align:left; margin:20px auto; max-width:300px;">
          <li>${summary.clients} client(s)</li>
          <li>${summary.rooms} chambre(s)</li>
          <li>${summary.reservations} réservation(s)</li>
          <li>${summary.orders} commande(s)</li>
          <li>${summary.stock} article(s) en stock</li>
          <li>${summary.expenses} dépense(s)</li>
        </ul>
        <p style="color:#667085; font-size:13px; margin-bottom:20px;">
          Ces données seront importées dans la base de données serveur.
        </p>
        <div id="migrationProgress" style="display:none; margin:15px 0;">
          <i class="fas fa-spinner fa-spin"></i> <span id="migrationStatus">En cours...</span>
        </div>
        <div class="btn-group" style="justify-content:center;">
          <button class="btn btn-primary" onclick="DataMigration.startMigration()">
            <i class="fas fa-upload"></i> Importer
          </button>
          <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
        </div>
      </div>
    `);
  },
  
  // Démarrer la migration
  async startMigration() {
    const progressDiv = document.getElementById('migrationProgress');
    const statusSpan = document.getElementById('migrationStatus');
    
    progressDiv.style.display = 'block';
    
    const results = await this.migrateAll((msg) => {
      statusSpan.textContent = msg;
    });
    
    if (results.success) {
      // Nettoyer les données locales
      this.clearLocalData();
      
      closeModal();
      showToast('Migration terminée avec succès!', 'success');
      
      // Recharger la page actuelle
      navigateTo(currentModule);
    } else {
      statusSpan.innerHTML = `<span style="color:red;">Erreurs: ${results.errors.join(', ')}</span>`;
    }
  }
};

// Export global
window.DataMigration = DataMigration;
