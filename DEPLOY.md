# Guide de Déploiement - Le Paradisier Manager

Ce guide vous accompagne étape par étape pour déployer l'application en production avec :
- **Supabase** : Base de données PostgreSQL gratuite
- **Render** : Hébergement du backend Node.js gratuit
- **Vercel** : Hébergement du frontend gratuit (ou GitHub Pages)

---

## Prérequis

- Un compte GitHub (vous l'avez déjà)
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [Render](https://render.com) (gratuit)
- Un compte [Vercel](https://vercel.com) (gratuit, optionnel)

---

## Étape 1 : Créer la base de données Supabase

### 1.1 Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et connectez-vous
2. Cliquez sur **"New Project"**
3. Remplissez :
   - **Name** : `paradisier-manager`
   - **Database Password** : Choisissez un mot de passe fort (NOTEZ-LE !)
   - **Region** : `West EU (Ireland)` ou la plus proche de Madagascar
4. Cliquez sur **"Create new project"**
5. Attendez 2-3 minutes que le projet soit créé

### 1.2 Récupérer l'URL de connexion

1. Dans votre projet Supabase, allez dans **Settings** (icône engrenage)
2. Cliquez sur **Database** dans le menu de gauche
3. Faites défiler jusqu'à **Connection string**
4. Copiez l'**URI** (mode "Transaction" recommandé)
   
   Elle ressemble à :
   ```
   postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```
5. Remplacez `[PASSWORD]` par votre mot de passe de base de données

### 1.3 Exécuter le schéma SQL

1. Dans Supabase, allez dans **SQL Editor** (icône code dans le menu)
2. Cliquez sur **"New query"**
3. Copiez-collez le contenu complet du fichier `backend/src/database/supabase-init.sql`
4. Cliquez sur **"Run"** (ou Ctrl+Enter)
5. Vous devriez voir "Success. No rows returned"

> **Important** : Ce script crée toutes les tables ET l'utilisateur admin par défaut.

---

## Étape 2 : Déployer le backend sur Render

### 2.1 Créer le service

1. Allez sur [render.com](https://render.com) et connectez-vous
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre compte GitHub si ce n'est pas fait
4. Sélectionnez le repository **Dashbord**
5. Configurez :
   - **Name** : `paradisier-api`
   - **Region** : `Frankfurt (EU Central)` ou proche
   - **Branch** : `main`
   - **Root Directory** : `backend`
   - **Runtime** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance Type** : `Free`

### 2.2 Configurer les variables d'environnement

Dans la section **Environment Variables**, ajoutez :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | `postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | *(voir ci-dessous)* |
| `JWT_REFRESH_SECRET` | *(voir ci-dessous)* |
| `CORS_ORIGINS` | `https://foriasser-hub.github.io,https://votre-domaine.vercel.app` |

#### Générer les clés JWT sécurisées

Exécutez cette commande dans un terminal :
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

Ou utilisez un générateur en ligne : [randomkeygen.com](https://randomkeygen.com)

### 2.3 Déployer

1. Cliquez sur **"Create Web Service"**
2. Attendez que le déploiement soit terminé (3-5 minutes)
3. Notez l'URL de votre service, par exemple :
   ```
   https://paradisier-api.onrender.com
   ```

### 2.4 Tester l'API

Ouvrez dans votre navigateur :
```
https://paradisier-api.onrender.com/api/health
```

Vous devriez voir :
```json
{"success":true,"message":"API Le Paradisier Manager opérationnelle",...}
```

---

## Étape 3 : Configurer le frontend

### Option A : GitHub Pages (recommandé - déjà configuré)

1. Dans votre repository GitHub, allez dans **Settings** → **Pages**
2. Sous **Source**, sélectionnez `main` branch et `/ (root)`
3. Cliquez **Save**
4. Votre site sera disponible à :
   ```
   https://foriasser-hub.github.io/Dashbord/index-new.html
   ```

### Option B : Vercel (alternative)

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez **"Add New..."** → **"Project"**
3. Importez votre repository GitHub **Dashbord**
4. Configurez :
   - **Framework Preset** : `Other`
   - **Root Directory** : `.` (racine)
   - **Build Command** : *(laisser vide)*
   - **Output Directory** : `.`
5. Ajoutez la variable d'environnement :
   - `VITE_API_URL` : `https://paradisier-api.onrender.com/api`
6. Cliquez **"Deploy"**

---

## Étape 4 : Mettre à jour l'URL de l'API dans le frontend

Le fichier `js/app.js` détecte automatiquement l'environnement. Mais vous devez mettre à jour l'URL de production :

1. Ouvrez `js/app.js`
2. Trouvez la section `APP_CONFIG`
3. Modifiez `productionApiURL` avec votre URL Render :

```javascript
const APP_CONFIG = {
  name: 'Le Paradisier Manager',
  currency: 'Ar',
  productionApiURL: 'https://paradisier-api.onrender.com/api', // ← Votre URL Render
  developmentApiURL: 'http://localhost:3000/api'
};
```

4. Commitez et poussez les changements

---

## Étape 5 : Première connexion

### Identifiants par défaut

- **Email** : `admin@paradisier.mg`
- **Mot de passe** : `Admin@123!`

### Changement obligatoire du mot de passe

À la première connexion, vous serez **obligé de changer le mot de passe**. 

Choisissez un mot de passe fort :
- Au moins 8 caractères
- Une majuscule
- Une minuscule
- Un chiffre
- Un caractère spécial

---

## Récapitulatif des URLs

| Service | URL |
|---------|-----|
| **Frontend** | `https://foriasser-hub.github.io/Dashbord/index-new.html` |
| **Backend API** | `https://paradisier-api.onrender.com` |
| **Health Check** | `https://paradisier-api.onrender.com/api/health` |
| **Supabase Dashboard** | `https://supabase.com/dashboard` |

---

## Dépannage

### Le backend ne démarre pas sur Render

1. Vérifiez les logs dans Render Dashboard
2. Assurez-vous que `DATABASE_URL` est correct
3. Vérifiez que `DB_SSL=true` est configuré

### Erreur CORS

1. Ajoutez votre domaine frontend dans `CORS_ORIGINS` sur Render
2. Séparez les domaines par des virgules, sans espaces

### La base de données ne se connecte pas

1. Vérifiez le mot de passe dans `DATABASE_URL`
2. Utilisez l'URL "Transaction" de Supabase (port 6543)
3. Assurez-vous que `DB_SSL=true`

### Le frontend ne charge pas les données

1. Ouvrez la console du navigateur (F12)
2. Vérifiez les erreurs réseau
3. Assurez-vous que `productionApiURL` pointe vers votre backend Render

---

## Maintenance

### Mettre à jour le code

1. Poussez vos modifications sur GitHub
2. Render redéploie automatiquement le backend
3. GitHub Pages/Vercel redéploie automatiquement le frontend

### Sauvegarder la base de données

1. Dans Supabase, allez dans **Settings** → **Database**
2. Cliquez sur **Download backup**

### Surveiller les logs

- **Render** : Dashboard → Votre service → Logs
- **Supabase** : Dashboard → Logs

---

## Support

En cas de problème :
1. Vérifiez d'abord ce guide de dépannage
2. Consultez les logs des services
3. Ouvrez une issue sur GitHub

Bonne utilisation ! 🌴
