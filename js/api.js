// ===========================================
// LE PARADISIER MANAGER - Client API
// Gère toutes les communications avec le backend
// ===========================================

const API = {
  // Configuration
  baseURL: 'http://localhost:3000/api',
  
  // Tokens
  accessToken: null,
  refreshToken: null,
  
  // Initialisation
  init() {
    this.accessToken = sessionStorage.getItem('paradisier_access_token');
    this.refreshToken = localStorage.getItem('paradisier_refresh_token');
    this.setupInterceptor();
  },
  
  // Configuration de la base URL
  setBaseURL(url) {
    this.baseURL = url;
  },
  
  // Sauvegarde des tokens
  setTokens(access, refresh) {
    this.accessToken = access;
    this.refreshToken = refresh;
    sessionStorage.setItem('paradisier_access_token', access);
    if (refresh) {
      localStorage.setItem('paradisier_refresh_token', refresh);
    }
  },
  
  // Suppression des tokens
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    sessionStorage.removeItem('paradisier_access_token');
    localStorage.removeItem('paradisier_refresh_token');
  },
  
  // Vérifier si connecté
  isAuthenticated() {
    return !!this.accessToken;
  },
  
  // Headers par défaut
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  },
  
  // Intercepteur pour refresh automatique
  setupInterceptor() {
    // L'intercepteur sera appelé si 401
  },
  
  // Requête générique avec gestion d'erreurs
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      method,
      headers: this.getHeaders(),
      ...options
    };
    
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }
    
    try {
      let response = await fetch(url, config);
      
      // Si token expiré, tenter un refresh
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/')) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          config.headers = this.getHeaders();
          response = await fetch(url, config);
        } else {
          this.clearTokens();
          window.location.reload();
          throw new Error('Session expirée');
        }
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw {
          status: response.status,
          message: result.message || 'Erreur serveur',
          errors: result.errors
        };
      }
      
      return result;
      
    } catch (error) {
      if (error.status) {
        throw error;
      }
      // Erreur réseau
      console.error('Erreur API:', error);
      throw {
        status: 0,
        message: 'Impossible de contacter le serveur'
      };
    }
  },
  
  // Refresh du token
  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      if (data.success && data.data.accessToken) {
        this.accessToken = data.data.accessToken;
        sessionStorage.setItem('paradisier_access_token', data.data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  
  // ===== MÉTHODES RACCOURCIES =====
  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, data) { return this.request('POST', endpoint, data); },
  patch(endpoint, data) { return this.request('PATCH', endpoint, data); },
  delete(endpoint) { return this.request('DELETE', endpoint); },
  
  // ===== AUTH =====
  auth: {
    async login(email, password) {
      const result = await API.post('/auth/login', { email, password });
      if (result.success) {
        API.setTokens(result.data.accessToken, result.data.refreshToken);
      }
      return result;
    },
    
    async logout() {
      try {
        await API.post('/auth/logout');
      } catch (e) {
        // Ignorer les erreurs
      }
      API.clearTokens();
    },
    
    async me() {
      return API.get('/auth/me');
    },
    
    async changePassword(currentPassword, newPassword) {
      return API.post('/auth/change-password', { currentPassword, newPassword });
    }
  },
  
  // ===== DASHBOARD =====
  dashboard: {
    stats() { return API.get('/dashboard/stats'); },
    revenue(period = 'week') { return API.get(`/dashboard/revenue?period=${period}`); },
    reports(from, to) { 
      let url = '/dashboard/reports';
      if (from || to) {
        const params = new URLSearchParams();
        if (from) params.append('from_date', from);
        if (to) params.append('to_date', to);
        url += '?' + params.toString();
      }
      return API.get(url);
    }
  },
  
  // ===== USERS =====
  users: {
    list() { return API.get('/users'); },
    get(id) { return API.get(`/users/${id}`); },
    create(data) { return API.post('/users', data); },
    update(id, data) { return API.patch(`/users/${id}`, data); },
    delete(id) { return API.delete(`/users/${id}`); },
    resetPassword(id, newPassword) { 
      return API.post(`/users/${id}/reset-password`, { newPassword }); 
    }
  },
  
  // ===== CLIENTS =====
  clients: {
    list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.get('/clients' + (query ? '?' + query : ''));
    },
    get(id) { return API.get(`/clients/${id}`); },
    create(data) { return API.post('/clients', data); },
    update(id, data) { return API.patch(`/clients/${id}`, data); },
    delete(id) { return API.delete(`/clients/${id}`); }
  },
  
  // ===== ROOMS =====
  rooms: {
    list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.get('/rooms' + (query ? '?' + query : ''));
    },
    available(checkIn, checkOut, type = null) {
      let url = `/rooms/available?check_in=${checkIn}&check_out=${checkOut}`;
      if (type) url += `&type=${type}`;
      return API.get(url);
    },
    get(id) { return API.get(`/rooms/${id}`); },
    create(data) { return API.post('/rooms', data); },
    update(id, data) { return API.patch(`/rooms/${id}`, data); },
    delete(id) { return API.delete(`/rooms/${id}`); }
  },
  
  // ===== RESERVATIONS =====
  reservations: {
    list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.get('/reservations' + (query ? '?' + query : ''));
    },
    get(id) { return API.get(`/reservations/${id}`); },
    create(data) { return API.post('/reservations', data); },
    update(id, data) { return API.patch(`/reservations/${id}`, data); },
    delete(id) { return API.delete(`/reservations/${id}`); },
    addPayment(id, amount, method) {
      return API.post(`/reservations/${id}/payment`, { amount, method });
    }
  },
  
  // ===== RESTAURANT =====
  restaurant: {
    list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.get('/restaurant-orders' + (query ? '?' + query : ''));
    },
    today() { return API.get('/restaurant-orders/today'); },
    get(id) { return API.get(`/restaurant-orders/${id}`); },
    create(data) { return API.post('/restaurant-orders', data); },
    update(id, data) { return API.patch(`/restaurant-orders/${id}`, data); },
    updateStatus(id, status) {
      return API.patch(`/restaurant-orders/${id}/status`, { status });
    },
    delete(id) { return API.delete(`/restaurant-orders/${id}`); }
  },
  
  // ===== STOCK =====
  stock: {
    list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.get('/stock' + (query ? '?' + query : ''));
    },
    alerts() { return API.get('/stock/alerts'); },
    value() { return API.get('/stock/value'); },
    get(id) { return API.get(`/stock/${id}`); },
    create(data) { return API.post('/stock', data); },
    update(id, data) { return API.patch(`/stock/${id}`, data); },
    adjust(id, adjustment, reason) {
      return API.post(`/stock/${id}/adjust`, { adjustment, reason });
    },
    delete(id) { return API.delete(`/stock/${id}`); }
  },
  
  // ===== EXPENSES =====
  expenses: {
    list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.get('/expenses' + (query ? '?' + query : ''));
    },
    summary(fromDate, toDate) {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      return API.get('/expenses/summary?' + params.toString());
    },
    get(id) { return API.get(`/expenses/${id}`); },
    create(data) { return API.post('/expenses', data); },
    update(id, data) { return API.patch(`/expenses/${id}`, data); },
    delete(id) { return API.delete(`/expenses/${id}`); }
  },
  
  // ===== INVOICES =====
  invoices: {
    list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.get('/invoices' + (query ? '?' + query : ''));
    },
    get(id) { return API.get(`/invoices/${id}`); },
    create(data) { return API.post('/invoices', data); },
    update(id, data) { return API.patch(`/invoices/${id}`, data); },
    addPayment(id, amount) {
      return API.post(`/invoices/${id}/payment`, { amount });
    },
    delete(id) { return API.delete(`/invoices/${id}`); }
  }
};

// Initialiser au chargement
API.init();

// Export global
window.API = API;
