/* ============================================
   LE PARADISIER MANAGER - Module de Stockage Local
   Stockage robuste avec IndexedDB + localStorage fallback
   ============================================ */

const LocalStorage = {
    DB_NAME: 'ParadisierDB',
    DB_VERSION: 1,
    db: null,
    
    // Collections disponibles
    STORES: ['settings', 'clients', 'rooms', 'reservations', 'orders', 'deliveries', 
             'stock', 'expenses', 'staff', 'accounting', 'invoices', 'auth'],
    
    // ===== INITIALISATION =====
    async init() {
        try {
            this.db = await this.openDB();
            console.log('IndexedDB initialisé');
            return true;
        } catch (error) {
            console.warn('IndexedDB non disponible, utilisation localStorage:', error);
            return false;
        }
    },
    
    // Ouvre/créé la base de données IndexedDB
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Créer les object stores
                this.STORES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                        store.createIndex('createdAt', 'createdAt', { unique: false });
                        if (storeName === 'clients') {
                            store.createIndex('name', 'name', { unique: false });
                            store.createIndex('phone', 'phone', { unique: false });
                        }
                        if (storeName === 'reservations' || storeName === 'orders') {
                            store.createIndex('date', 'date', { unique: false });
                            store.createIndex('status', 'status', { unique: false });
                        }
                    }
                });
            };
        });
    },
    
    // ===== OPÉRATIONS CRUD =====
    
    // Obtenir tous les éléments d'une collection
    async getAll(storeName) {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        }
        // Fallback localStorage
        return this.getFromLocalStorage(storeName);
    },
    
    // Obtenir un élément par ID
    async get(storeName, id) {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        const all = this.getFromLocalStorage(storeName);
        return all.find(item => item.id === id);
    },
    
    // Ajouter un élément
    async add(storeName, data) {
        const item = {
            ...data,
            id: data.id || this.generateId(storeName),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.add(item);
                request.onsuccess = () => resolve(item);
                request.onerror = () => reject(request.error);
            });
        }
        // Fallback localStorage
        const all = this.getFromLocalStorage(storeName);
        all.push(item);
        this.saveToLocalStorage(storeName, all);
        return item;
    },
    
    // Mettre à jour un élément
    async update(storeName, id, data) {
        const existing = await this.get(storeName, id);
        if (!existing) throw new Error('Élément non trouvé');
        
        const updated = {
            ...existing,
            ...data,
            id, // Préserver l'ID
            updatedAt: new Date().toISOString()
        };
        
        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.put(updated);
                request.onsuccess = () => resolve(updated);
                request.onerror = () => reject(request.error);
            });
        }
        // Fallback localStorage
        const all = this.getFromLocalStorage(storeName);
        const index = all.findIndex(item => item.id === id);
        if (index !== -1) {
            all[index] = updated;
            this.saveToLocalStorage(storeName, all);
        }
        return updated;
    },
    
    // Supprimer un élément
    async delete(storeName, id) {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.delete(id);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }
        // Fallback localStorage
        const all = this.getFromLocalStorage(storeName);
        const filtered = all.filter(item => item.id !== id);
        this.saveToLocalStorage(storeName, filtered);
        return true;
    },
    
    // Vider une collection
    async clear(storeName) {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }
        this.saveToLocalStorage(storeName, []);
        return true;
    },
    
    // ===== EXPORT / IMPORT =====
    
    // Exporter toutes les données
    async exportAll() {
        const data = {
            version: this.DB_VERSION,
            exportedAt: new Date().toISOString(),
            appName: 'Le Paradisier Manager',
            collections: {}
        };
        
        for (const storeName of this.STORES) {
            data.collections[storeName] = await this.getAll(storeName);
        }
        
        return data;
    },
    
    // Importer des données (remplace tout)
    async importAll(data) {
        if (!data || !data.collections) {
            throw new Error('Format de données invalide');
        }
        
        for (const storeName of this.STORES) {
            if (data.collections[storeName]) {
                await this.clear(storeName);
                for (const item of data.collections[storeName]) {
                    await this.add(storeName, item);
                }
            }
        }
        
        return true;
    },
    
    // ===== HELPERS =====
    
    generateId(prefix) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 6);
        return `${prefix.toUpperCase().substr(0, 3)}-${timestamp}-${random}`;
    },
    
    // LocalStorage fallback
    getFromLocalStorage(storeName) {
        try {
            const data = localStorage.getItem(`paradisier_${storeName}`);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },
    
    saveToLocalStorage(storeName, data) {
        try {
            localStorage.setItem(`paradisier_${storeName}`, JSON.stringify(data));
        } catch (e) {
            console.error('Erreur sauvegarde localStorage:', e);
        }
    },
    
    // Migration depuis l'ancien format localStorage
    async migrateFromOldFormat() {
        const oldKeys = ['reservations', 'rooms', 'orders', 'deliveries', 'clients', 
                        'stock', 'expenses', 'staff', 'settings', 'accounting'];
        
        let migrated = false;
        
        for (const key of oldKeys) {
            const oldData = localStorage.getItem(`paradisier_${key}`);
            if (oldData) {
                try {
                    const items = JSON.parse(oldData);
                    if (Array.isArray(items) && items.length > 0) {
                        const existing = await this.getAll(key);
                        if (existing.length === 0) {
                            for (const item of items) {
                                await this.add(key, item);
                            }
                            migrated = true;
                            console.log(`Migré ${items.length} éléments vers ${key}`);
                        }
                    }
                } catch (e) {
                    console.warn(`Erreur migration ${key}:`, e);
                }
            }
        }
        
        return migrated;
    }
};

// ===== MODULE AUTHENTIFICATION LOCALE =====
const LocalAuth = {
    SETTINGS_KEY: 'auth',
    SESSION_KEY: 'paradisier_session',
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 heures
    
    currentUser: null,
    
    // Hash SHA-256 du mot de passe
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'ParadisierLocalSalt2024');
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },
    
    // Initialiser l'authentification
    async init() {
        const authData = await LocalStorage.getAll(this.SETTINGS_KEY);
        
        // Si pas de config auth, créer le mot de passe par défaut
        if (!authData || authData.length === 0) {
            const defaultHash = await this.hashPassword('admin123');
            await LocalStorage.add(this.SETTINGS_KEY, {
                id: 'auth_config',
                passwordHash: defaultHash,
                setupCompleted: false,
                createdAt: new Date().toISOString()
            });
        }
        
        // Vérifier la session existante
        return this.checkSession();
    },
    
    // Vérifier la session
    checkSession() {
        try {
            const session = sessionStorage.getItem(this.SESSION_KEY);
            if (session) {
                const data = JSON.parse(session);
                if (data.expiresAt > Date.now()) {
                    this.currentUser = data;
                    return true;
                }
            }
        } catch {}
        this.currentUser = null;
        return false;
    },
    
    // Connexion
    async login(password) {
        const authData = await LocalStorage.getAll(this.SETTINGS_KEY);
        const config = authData.find(a => a.id === 'auth_config');
        
        if (!config) {
            return { success: false, message: 'Configuration non trouvée' };
        }
        
        const hash = await this.hashPassword(password);
        
        if (hash !== config.passwordHash) {
            return { success: false, message: 'Mot de passe incorrect' };
        }
        
        // Créer la session
        const session = {
            authenticated: true,
            loginTime: Date.now(),
            expiresAt: Date.now() + this.SESSION_DURATION,
            mustChangePassword: !config.setupCompleted
        };
        
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        this.currentUser = session;
        
        return { 
            success: true, 
            mustChangePassword: session.mustChangePassword 
        };
    },
    
    // Changer le mot de passe
    async changePassword(currentPassword, newPassword) {
        // Vérifier l'ancien mot de passe
        const authData = await LocalStorage.getAll(this.SETTINGS_KEY);
        const config = authData.find(a => a.id === 'auth_config');
        
        const currentHash = await this.hashPassword(currentPassword);
        if (currentHash !== config.passwordHash) {
            return { success: false, message: 'Mot de passe actuel incorrect' };
        }
        
        // Valider le nouveau mot de passe
        if (newPassword.length < 6) {
            return { success: false, message: 'Le mot de passe doit faire au moins 6 caractères' };
        }
        
        // Mettre à jour
        const newHash = await this.hashPassword(newPassword);
        await LocalStorage.update(this.SETTINGS_KEY, 'auth_config', {
            passwordHash: newHash,
            setupCompleted: true,
            updatedAt: new Date().toISOString()
        });
        
        return { success: true, message: 'Mot de passe modifié avec succès' };
    },
    
    // Déconnexion
    logout() {
        sessionStorage.removeItem(this.SESSION_KEY);
        this.currentUser = null;
        window.location.reload();
    },
    
    // Vérifier si connecté
    isAuthenticated() {
        return this.checkSession();
    }
};

// Export global
window.LocalStorage = LocalStorage;
window.LocalAuth = LocalAuth;
