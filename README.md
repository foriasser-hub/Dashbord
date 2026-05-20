# Le Paradisier Manager 🌴

Application de gestion complète pour hôtel-restaurant à Madagascar.

## ✨ Fonctionnalités

- 🏨 **Gestion des réservations** - Chambres et appartements
- 🍽️ **Restaurant** - Commandes, livraisons
- 👥 **Clients** - Fiches clients avec historique
- 📦 **Stock** - Gestion d'inventaire avec alertes
- 💰 **Finances** - Dépenses, factures, rapports
- 👤 **Utilisateurs** - Multi-comptes avec rôles
- 📊 **Dashboard** - KPIs en temps réel

## 🏗️ Architecture

```
Le Paradisier Manager/
├── backend/                 # API Node.js + PostgreSQL
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── database/        # Schéma et migrations
│   │   ├── middleware/      # Auth, validation, rôles
│   │   ├── routes/          # Endpoints API
│   │   └── server.js        # Point d'entrée
│   └── package.json
│
├── js/                      # Frontend JavaScript
│   ├── api.js               # Client API
│   ├── auth.js              # Authentification
│   ├── migration.js         # Migration localStorage
│   └── app.js               # Application principale
│
├── index-new.html           # Interface (version API)
├── index.html               # Interface (version localStorage)
└── styles.css               # Styles
```

## 🚀 Démarrage rapide

### 1. Configurer le backend

```bash
cd backend
cp .env.example .env
# Éditez .env avec votre DATABASE_URL PostgreSQL

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### 2. Lancer le frontend

Ouvrez `index-new.html` dans votre navigateur ou servez avec:
```bash
npx serve .
```

### 3. Connexion

Utilisez les identifiants fournis lors de l'installation initiale.

> **Note de sécurité:** L'utilisateur admin sera obligé de changer son mot de passe à la première connexion.

## 🔐 Sécurité

### Backend
- ✅ Authentification JWT avec refresh tokens
- ✅ Hashage bcrypt des mots de passe
- ✅ Rate limiting sur connexion et API
- ✅ Validation des entrées (express-validator)
- ✅ Protection CORS configurée
- ✅ Headers sécurisés (Helmet)
- ✅ Audit log des actions sensibles

### Frontend
- ✅ Protection XSS (échappement HTML)
- ✅ Tokens stockés en session/localStorage
- ✅ Refresh automatique des tokens
- ✅ Vérification des permissions

## 👤 Rôles utilisateurs

| Rôle | Description | Accès |
|------|-------------|-------|
| **admin** | Administrateur | Accès total, gestion utilisateurs |
| **manager** | Gérant | Gestion quotidienne |
| **employe** | Employé | Commandes, clients (limité) |
| **comptable** | Comptable | Finances, rapports |

## 📡 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion |
| GET | `/api/dashboard/stats` | Statistiques |
| GET/POST | `/api/clients` | Clients |
| GET/POST | `/api/rooms` | Chambres |
| GET/POST | `/api/reservations` | Réservations |
| GET/POST | `/api/restaurant-orders` | Commandes |
| GET/POST | `/api/stock` | Stock |
| GET/POST | `/api/expenses` | Dépenses |
| GET/POST | `/api/invoices` | Factures |

➡️ Voir `/backend/README.md` pour la documentation complète.

## 🗄️ Base de données

PostgreSQL avec les tables:
- `users` - Utilisateurs et authentification
- `clients` - Clients du restaurant/hôtel
- `rooms` - Chambres et appartements
- `reservations` - Réservations
- `restaurant_orders` - Commandes restaurant
- `deliveries` - Livraisons
- `stock_items` - Stock
- `expenses` - Dépenses
- `invoices` - Factures
- `audit_logs` - Journal d'audit

## 🌐 Déploiement

### Backend (recommandé)
- [Render](https://render.com)
- [Railway](https://railway.app)
- [Fly.io](https://fly.io)

### Base de données
- [Supabase](https://supabase.com) - PostgreSQL gratuit
- [Neon](https://neon.tech)
- Railway PostgreSQL

### Frontend
- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- GitHub Pages

## 📦 Migration des données

Si vous avez des données dans l'ancienne version (localStorage):

1. Connectez-vous avec un compte admin
2. Allez dans Paramètres > Migration
3. Cliquez sur "Importer les données locales"

## 🛠️ Technologies

- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Auth:** JWT, bcrypt
- **Charts:** Chart.js
- **Icons:** Font Awesome

## 📄 Licence

MIT License - © 2024 Le Paradisier

---

**Le Paradisier Manager** - Votre solution de gestion hôtelière 🌴
