/* ============================================
   LE PARADISIER MANAGER - Module de Sécurité
   ============================================ */

// ===== 1. PROTECTION XSS =====
const Security = {
    // Échappement HTML pour prévenir les injections XSS
    escapeHtml: function(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    // Échappement pour les attributs HTML
    escapeAttr: function(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    // Sanitisation d'un objet complet
    sanitizeObject: function(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return typeof obj === 'string' ? this.escapeHtml(obj) : obj;
        }
        const sanitized = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = this.sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }
};



// ===== 2. CHIFFREMENT DES DONNÉES =====
const Encryption = {
    // Clé de chiffrement dérivée du mot de passe utilisateur
    _key: null,
    
    // Génère une clé à partir d'un mot de passe
    async deriveKey(password) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']
        );
        this._key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: encoder.encode('ParadisierSalt2024'), iterations: 100000, hash: 'SHA-256' },
            keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
        return this._key;
    },

    // Chiffre les données
    async encrypt(data) {
        if (!this._key) return JSON.stringify(data);
        try {
            const encoder = new TextEncoder();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv }, this._key, encoder.encode(JSON.stringify(data))
            );
            return JSON.stringify({
                iv: Array.from(iv),
                data: Array.from(new Uint8Array(encrypted))
            });
        } catch (e) { console.error('Encryption error:', e); return JSON.stringify(data); }
    },

    // Déchiffre les données
    async decrypt(encryptedStr) {
        if (!this._key) return JSON.parse(encryptedStr);
        try {
            const { iv, data } = JSON.parse(encryptedStr);
            if (!iv || !data) return JSON.parse(encryptedStr);
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: new Uint8Array(iv) }, this._key, new Uint8Array(data)
            );
            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (e) { return JSON.parse(encryptedStr); }
    }
};



// ===== 3. SYSTÈME D'AUTHENTIFICATION =====
const Auth = {
    SESSION_KEY: 'paradisier_session',
    USERS_KEY: 'paradisier_users',
    SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 heures

    // Initialise les utilisateurs par défaut si vide
    init() {
        const users = this.getUsers();
        if (users.length === 0) {
            // Utilisateur admin par défaut (mot de passe: admin123)
            this.createUser('admin', 'admin123', 'Administrateur', 'admin');
        }
    },

    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
        } catch { return []; }
    },

    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },

    // Hash du mot de passe avec SHA-256
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'ParadisierSalt');
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // Créer un utilisateur
    async createUser(username, password, fullName, role = 'user') {
        const users = this.getUsers();
        if (users.find(u => u.username === username)) return false;
        const hashedPassword = await this.hashPassword(password);
        users.push({
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
            username, password: hashedPassword, fullName, role,
            createdAt: new Date().toISOString()
        });
        this.saveUsers(users);
        return true;
    },


    // Connexion utilisateur
    async login(username, password) {
        const users = this.getUsers();
        const hashedPassword = await this.hashPassword(password);
        const user = users.find(u => u.username === username && u.password === hashedPassword);
        if (!user) return { success: false, message: 'Identifiants incorrects' };
        
        const session = {
            userId: user.id, username: user.username, fullName: user.fullName,
            role: user.role, loginTime: Date.now(),
            expiresAt: Date.now() + this.SESSION_DURATION,
            token: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2)
        };
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        
        // Dériver la clé de chiffrement à partir du mot de passe
        await Encryption.deriveKey(password);
        
        return { success: true, user: { username: user.username, fullName: user.fullName, role: user.role } };
    },

    // Vérifier la session
    isAuthenticated() {
        try {
            const session = JSON.parse(sessionStorage.getItem(this.SESSION_KEY));
            if (!session) return false;
            if (Date.now() > session.expiresAt) { this.logout(); return false; }
            return true;
        } catch { return false; }
    },

    // Obtenir l'utilisateur courant
    getCurrentUser() {
        try {
            const session = JSON.parse(sessionStorage.getItem(this.SESSION_KEY));
            return session ? { username: session.username, fullName: session.fullName, role: session.role } : null;
        } catch { return null; }
    },

    // Déconnexion
    logout() {
        sessionStorage.removeItem(this.SESSION_KEY);
        Encryption._key = null;
        window.location.reload();
    },

    // Vérifier si admin
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
};



// ===== 4. VALIDATION DES ENTRÉES =====
const Validator = {
    // Validation d'email
    isValidEmail(email) {
        if (!email) return true; // Email optionnel
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validation de téléphone malgache
    isValidPhone(phone) {
        if (!phone) return true;
        const re = /^(\+261|0)(32|33|34|38)[0-9]{7}$/;
        return re.test(phone.replace(/\s/g, ''));
    },

    // Validation de montant
    isValidAmount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num >= 0 && num <= 999999999;
    },

    // Validation de date
    isValidDate(dateStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    },

    // Validation de texte (longueur, caractères interdits)
    isValidText(text, maxLength = 500) {
        if (!text) return true;
        if (text.length > maxLength) return false;
        // Bloque les balises script
        if (/<script|javascript:|on\w+=/i.test(text)) return false;
        return true;
    },

    // Valider un formulaire complet
    validateForm(formData, rules) {
        const errors = [];
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            if (rule.required && !value) {
                errors.push(`${rule.label || field} est requis`);
            }
            if (rule.type === 'email' && !this.isValidEmail(value)) {
                errors.push(`Email invalide`);
            }
            if (rule.type === 'phone' && !this.isValidPhone(value)) {
                errors.push(`Numéro de téléphone invalide`);
            }
            if (rule.type === 'amount' && !this.isValidAmount(value)) {
                errors.push(`Montant invalide`);
            }
            if (rule.maxLength && value && value.length > rule.maxLength) {
                errors.push(`${rule.label || field} trop long (max ${rule.maxLength} caractères)`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
};



// ===== 5. GÉNÉRATION D'ID SÉCURISÉE =====
function secureGenerateId(prefix) {
    if (crypto.randomUUID) {
        return prefix + '-' + crypto.randomUUID().split('-')[0];
    }
    // Fallback avec crypto.getRandomValues
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    return prefix + '-' + Array.from(arr, b => b.toString(16).padStart(2, '0')).join('').substr(0, 12);
}

// ===== 6. RATE LIMITING (Protection contre le spam) =====
const RateLimiter = {
    actions: {},
    
    // Vérifie si une action est autorisée
    canPerform(action, maxPerMinute = 30) {
        const now = Date.now();
        const key = action;
        if (!this.actions[key]) this.actions[key] = [];
        
        // Nettoyer les entrées de plus d'une minute
        this.actions[key] = this.actions[key].filter(t => now - t < 60000);
        
        if (this.actions[key].length >= maxPerMinute) {
            return false;
        }
        this.actions[key].push(now);
        return true;
    },

    // Réinitialiser
    reset(action) {
        if (action) delete this.actions[action];
        else this.actions = {};
    }
};

// ===== 7. AUDIT LOG =====
const AuditLog = {
    LOG_KEY: 'paradisier_audit',
    MAX_ENTRIES: 1000,

    log(action, details = {}) {
        try {
            const logs = JSON.parse(localStorage.getItem(this.LOG_KEY)) || [];
            const user = Auth.getCurrentUser();
            logs.push({
                timestamp: new Date().toISOString(),
                user: user ? user.username : 'anonymous',
                action, details,
                userAgent: navigator.userAgent.substring(0, 100)
            });
            // Garder seulement les dernières entrées
            if (logs.length > this.MAX_ENTRIES) logs.splice(0, logs.length - this.MAX_ENTRIES);
            localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
        } catch (e) { console.warn('Audit log error:', e); }
    },

    getRecentLogs(count = 50) {
        try {
            const logs = JSON.parse(localStorage.getItem(this.LOG_KEY)) || [];
            return logs.slice(-count).reverse();
        } catch { return []; }
    }
};



// ===== 8. INTERFACE DE CONNEXION =====
function renderLoginScreen() {
    return `
    <div class="login-container">
        <div class="login-box">
            <div class="login-header">
                <span class="login-logo">🌴</span>
                <h1>Le Paradisier</h1>
                <p>Manager - Connexion sécurisée</p>
            </div>
            <form id="loginForm" onsubmit="handleLogin(event)">
                <div class="login-form-group">
                    <label for="username"><i class="fas fa-user"></i> Identifiant</label>
                    <input type="text" id="username" name="username" class="login-input" 
                           required autocomplete="username" placeholder="Votre identifiant">
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
                <p><i class="fas fa-shield-alt"></i> Connexion sécurisée</p>
                <small>Première connexion: admin / admin123</small>
            </div>
        </div>
    </div>`;
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');
    
    // Rate limiting
    if (!RateLimiter.canPerform('login', 5)) {
        errorDiv.textContent = 'Trop de tentatives. Réessayez dans une minute.';
        errorDiv.style.display = 'block';
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    const result = await Auth.login(username, password);
    
    if (result.success) {
        AuditLog.log('LOGIN_SUCCESS', { username });
        window.location.reload();
    } else {
        AuditLog.log('LOGIN_FAILED', { username });
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
    }
}

// Export pour utilisation globale
window.Security = Security;
window.Encryption = Encryption;
window.Auth = Auth;
window.Validator = Validator;
window.RateLimiter = RateLimiter;
window.AuditLog = AuditLog;
window.secureGenerateId = secureGenerateId;
window.renderLoginScreen = renderLoginScreen;
window.handleLogin = handleLogin;
