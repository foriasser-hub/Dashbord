// ===========================================
// LE PARADISIER MANAGER - Module Auth Frontend
// Gère l'authentification côté client
// ===========================================

const AuthManager = {
  // Utilisateur courant
  currentUser: null,
  
  // Permissions par rôle (mirroir du backend)
  PERMISSIONS: {
    admin: {
      users: ['read', 'create', 'update', 'delete'],
      clients: ['read', 'create', 'update', 'delete'],
      rooms: ['read', 'create', 'update', 'delete'],
      reservations: ['read', 'create', 'update', 'delete'],
      restaurant: ['read', 'create', 'update', 'delete'],
      deliveries: ['read', 'create', 'update', 'delete'],
      stock: ['read', 'create', 'update', 'delete'],
      expenses: ['read', 'create', 'update', 'delete'],
      invoices: ['read', 'create', 'update', 'delete'],
      staff: ['read', 'create', 'update', 'delete'],
      reports: ['read', 'export'],
      settings: ['read', 'update'],
      audit: ['read']
    },
    manager: {
      users: ['read'],
      clients: ['read', 'create', 'update'],
      rooms: ['read', 'create', 'update'],
      reservations: ['read', 'create', 'update', 'delete'],
      restaurant: ['read', 'create', 'update', 'delete'],
      deliveries: ['read', 'create', 'update', 'delete'],
      stock: ['read', 'create', 'update'],
      expenses: ['read', 'create', 'update'],
      invoices: ['read', 'create', 'update'],
      staff: ['read', 'update'],
      reports: ['read', 'export'],
      settings: ['read'],
      audit: []
    },
    employe: {
      users: [],
      clients: ['read', 'create'],
      rooms: ['read'],
      reservations: ['read', 'create'],
      restaurant: ['read', 'create', 'update'],
      deliveries: ['read', 'create', 'update'],
      stock: ['read'],
      expenses: [],
      invoices: ['read'],
      staff: [],
      reports: [],
      settings: [],
      audit: []
    },
    comptable: {
      users: [],
      clients: ['read'],
      rooms: ['read'],
      reservations: ['read'],
      restaurant: ['read'],
      deliveries: ['read'],
      stock: ['read'],
      expenses: ['read', 'create', 'update', 'delete'],
      invoices: ['read', 'create', 'update', 'delete'],
      staff: ['read'],
      reports: ['read', 'export'],
      settings: [],
      audit: ['read']
    }
  },
  
  // Mapping des modules aux ressources
  MODULE_RESOURCES: {
    dashboard: null, // Accessible à tous
    reservations: 'reservations',
    rooms: 'rooms',
    restaurant: 'restaurant',
    deliveries: 'deliveries',
    clients: 'clients',
    stock: 'stock',
    expenses: 'expenses',
    finances: 'expenses',
    accounting: 'expenses',
    staff: 'staff',
    invoices: 'invoices',
    reports: 'reports',
    settings: 'settings'
  },
  
  // Vérifier si authentifié
  isAuthenticated() {
    return API.isAuthenticated() && this.currentUser !== null;
  },
  
  // Connexion
  async login(email, password) {
    try {
      const result = await API.auth.login(email, password);
      
      if (result.success) {
        this.currentUser = result.data.user;
        this.saveUserToSession(result.data.user);
        
        // Vérifier si l'utilisateur doit changer son mot de passe
        if (result.data.user.mustChangePassword) {
          return { 
            success: true, 
            user: result.data.user,
            mustChangePassword: true
          };
        }
        
        return { success: true, user: result.data.user };
      }
      
      return { success: false, message: result.message };
      
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur de connexion'
      };
    }
  },
  
  // Déconnexion
  async logout() {
    try {
      await API.auth.logout();
    } catch (e) {
      // Ignorer
    }
    this.currentUser = null;
    this.clearSession();
    window.location.reload();
  },
  
  // Charger l'utilisateur depuis la session
  loadFromSession() {
    const userData = sessionStorage.getItem('paradisier_user');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  },
  
  // Sauvegarder l'utilisateur en session
  saveUserToSession(user) {
    sessionStorage.setItem('paradisier_user', JSON.stringify(user));
  },
  
  // Effacer la session
  clearSession() {
    sessionStorage.removeItem('paradisier_user');
    sessionStorage.removeItem('paradisier_access_token');
    localStorage.removeItem('paradisier_refresh_token');
  },
  
  // Vérifier une permission
  hasPermission(resource, action) {
    if (!this.currentUser) return false;
    
    const rolePerms = this.PERMISSIONS[this.currentUser.role];
    if (!rolePerms) return false;
    
    const resourcePerms = rolePerms[resource];
    if (!resourcePerms) return false;
    
    return resourcePerms.includes(action);
  },
  
  // Vérifier l'accès à un module
  canAccessModule(module) {
    if (!this.currentUser) return false;
    
    const resource = this.MODULE_RESOURCES[module];
    
    // Dashboard accessible à tous
    if (resource === null) return true;
    
    return this.hasPermission(resource, 'read');
  },
  
  // Obtenir le rôle affiché
  getRoleLabel(role) {
    const labels = {
      admin: 'Administrateur',
      manager: 'Manager',
      employe: 'Employé',
      comptable: 'Comptable'
    };
    return labels[role] || role;
  },
  
  // Obtenir les initiales
  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  },
  
  // Vérifier le token au chargement
  async verifyToken() {
    if (!API.isAuthenticated()) {
      return false;
    }
    
    try {
      const result = await API.auth.me();
      if (result.success) {
        this.currentUser = result.data;
        this.saveUserToSession(result.data);
        return true;
      }
      return false;
    } catch (error) {
      this.clearSession();
      return false;
    }
  },
  
  // Changement de mot de passe
  async changePassword(currentPassword, newPassword) {
    try {
      const result = await API.auth.changePassword(currentPassword, newPassword);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors du changement'
      };
    }
  }
};

// Export global
window.AuthManager = AuthManager;
