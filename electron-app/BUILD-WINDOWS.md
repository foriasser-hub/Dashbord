# Comment générer l'installateur Windows

## Option 1 : Sur un PC Windows (Recommandé)

### Prérequis
1. **Installer Node.js** : https://nodejs.org (version 18 ou plus récente)
2. **Télécharger le projet** depuis GitHub

### Étapes

```cmd
# 1. Ouvrir PowerShell ou Command Prompt

# 2. Aller dans le dossier electron-app
cd chemin\vers\Dashbord\electron-app

# 3. Installer les dépendances
npm install

# 4. Générer l'installateur Windows
npm run dist:win
```

### Résultat
Le fichier sera créé dans :
```
electron-app/dist/Le-Paradisier-Manager-Setup-2.0.0.exe
```

---

## Option 2 : Utiliser GitHub Actions (CI/CD)

Ajoutez ce fichier `.github/workflows/build.yml` dans le repository :

```yaml
name: Build Electron App

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        working-directory: ./electron-app
        run: npm install
        
      - name: Build Windows installer
        working-directory: ./electron-app
        run: npm run dist:win
        
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: windows-installer
          path: electron-app/dist/*.exe
```

Ensuite :
1. Allez sur GitHub > Actions
2. Lancez le workflow manuellement
3. Téléchargez l'artifact `windows-installer`

---

## Option 3 : Version portable (sans installation)

Le dossier `dist/win-unpacked/` contient une version portable qui fonctionne sans installation :

1. Copiez tout le dossier `win-unpacked` sur une clé USB
2. Renommez-le en `Le Paradisier Manager`
3. Double-cliquez sur `Le Paradisier Manager.exe`

---

## Taille des fichiers

| Fichier | Taille |
|---------|--------|
| `Le-Paradisier-Manager-Setup-2.0.0.exe` | ~110 Mo |
| `dist/win-unpacked/` (portable) | ~220 Mo |

---

## Problèmes courants

### "npm n'est pas reconnu"
→ Installez Node.js depuis https://nodejs.org et redémarrez votre terminal

### L'installateur ne se crée pas
→ Vérifiez que vous avez les droits administrateur
→ Désactivez temporairement l'antivirus

### L'application ne démarre pas
→ Installez Visual C++ Redistributable : https://aka.ms/vs/17/release/vc_redist.x64.exe
