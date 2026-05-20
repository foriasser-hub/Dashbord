# Le Paradisier Manager - Backend API

Backend sécurisé pour l'application de gestion hôtelière et restaurant.

## 🚀 Technologies

- **Node.js** >= 18.0
- **Express.js** - Framework web
- **PostgreSQL** - Base de données
- **JWT** - Authentification
- **bcrypt** - Hashage des mots de passe
- **Helmet** - Sécurité des headers HTTP
- **Express Rate Limit** - Protection contre les attaques

## 📦 Installation

1. **Cloner et installer les dépendances:**
```bash
cd backend
npm install
```

2. **Configurer l'environnement:**
```bash
cp .env.example .env
# Éditez .env avec vos paramètres
```

3. **Configuration PostgreSQL requise:**
- Créez une base de données PostgreSQL
- Options recommandées:
  - **Local:** PostgreSQL installé localement
  - **Supabase:** https://supabase.com (gratuit)
  - **Neon:** https://neon.tech (gratuit)
  - **Railway:** https://railway.app

4. **Initialiser la base de données:**
```bash
npm run db:migrate
npm run db:seed
```

5. **Démarrer le serveur:**
```bash
# Développement
npm run dev

# Production
npm start
```

## 🔐 Authentification

### Première connexion:
Les identifiants admin par défaut sont définis dans le fichier `.env.example`.

> **Sécurité:** À la première connexion, l'admin sera **obligé de changer son mot de passe**.

### Rôles disponibles:
| Rôle | Accès |
|------|-------|
| **admin** | Accès total, gestion utilisateurs |
| **manager** | Gestion quotidienne, pas de suppression |
| **employe** | Commandes, livraisons, clients |
| **comptable** | Finances, factures, rapports |

## 📡 API Endpoints

### Authentification
```
POST   /api/auth/login           # Connexion
POST   /api/auth/logout          # Déconnexion
POST   /api/auth/refresh         # Rafraîchir le token
GET    /api/auth/me              # Utilisateur courant
POST   /api/auth/change-password # Changer mot de passe
```

### Utilisateurs (Admin)
```
GET    /api/users                # Liste
POST   /api/users                # Créer
PATCH  /api/users/:id            # Modifier
DELETE /api/users/:id            # Désactiver
```

### Clients
```
GET    /api/clients              # Liste
POST   /api/clients              # Créer
PATCH  /api/clients/:id          # Modifier
DELETE /api/clients/:id          # Supprimer
```

### Chambres
```
GET    /api/rooms                # Liste
GET    /api/rooms/available      # Disponibles
POST   /api/rooms                # Créer
PATCH  /api/rooms/:id            # Modifier
DELETE /api/rooms/:id            # Supprimer
```

### Réservations
```
GET    /api/reservations         # Liste
POST   /api/reservations         # Créer
PATCH  /api/reservations/:id     # Modifier
DELETE /api/reservations/:id     # Annuler
POST   /api/reservations/:id/payment # Paiement
```

### Restaurant
```
GET    /api/restaurant-orders        # Liste
GET    /api/restaurant-orders/today  # Aujourd'hui
POST   /api/restaurant-orders        # Créer
PATCH  /api/restaurant-orders/:id    # Modifier
DELETE /api/restaurant-orders/:id    # Annuler
```

### Stock
```
GET    /api/stock                # Liste
GET    /api/stock/alerts         # Alertes
GET    /api/stock/value          # Valeur totale
POST   /api/stock                # Créer
POST   /api/stock/:id/adjust     # Ajuster quantité
```

### Dépenses & Factures
```
GET    /api/expenses             # Dépenses
GET    /api/expenses/summary     # Résumé par catégorie
GET    /api/invoices             # Factures
POST   /api/invoices/:id/payment # Paiement facture
```

### Dashboard
```
GET    /api/dashboard/stats      # KPIs
GET    /api/dashboard/revenue    # Revenus par période
GET    /api/dashboard/reports    # Rapports complets
```

## 🛡️ Sécurité

- ✅ Hashage bcrypt des mots de passe
- ✅ JWT avec refresh tokens
- ✅ Rate limiting (connexion et API)
- ✅ Validation des entrées
- ✅ Protection CORS
- ✅ Headers sécurisés (Helmet)
- ✅ Audit logging
- ✅ Permissions par rôle

## 📁 Structure du projet

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js     # Configuration PostgreSQL
│   │   └── index.js        # Configuration générale
│   ├── database/
│   │   ├── schema.sql      # Schéma de la DB
│   │   ├── migrate.js      # Script de migration
│   │   ├── seed.js         # Données initiales
│   │   └── reset.js        # Reset de la DB
│   ├── middleware/
│   │   ├── auth.js         # Authentification JWT
│   │   ├── roles.js        # Permissions
│   │   └── validate.js     # Validation
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── clients.routes.js
│   │   ├── rooms.routes.js
│   │   ├── reservations.routes.js
│   │   ├── restaurant.routes.js
│   │   ├── stock.routes.js
│   │   ├── expenses.routes.js
│   │   ├── invoices.routes.js
│   │   ├── dashboard.routes.js
│   │   └── index.js
│   ├── utils/
│   │   └── logger.js       # Winston logger
│   └── server.js           # Point d'entrée
├── logs/                    # Fichiers de log
├── .env.example
├── package.json
└── README.md
```

## 🌐 Déploiement

### Options recommandées:

**Backend:**
- [Render](https://render.com) - Gratuit
- [Railway](https://railway.app) - Facile
- [Fly.io](https://fly.io) - Performant

**Base de données:**
- [Supabase](https://supabase.com) - PostgreSQL gratuit
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Railway PostgreSQL](https://railway.app)

### Variables d'environnement en production:
```
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=votre-clé-secrète-très-longue
JWT_REFRESH_SECRET=autre-clé-secrète
CORS_ORIGINS=https://votre-domaine.com
```

## 📝 Scripts NPM

```bash
npm start         # Démarrer en production
npm run dev       # Démarrer en développement
npm run db:migrate # Créer les tables
npm run db:seed   # Insérer les données initiales
npm run db:reset  # Supprimer toutes les données
```
