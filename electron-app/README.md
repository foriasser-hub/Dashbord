# Le Paradisier Manager - Application Desktop

Application de gestion hôtelière 100% hors-ligne pour Windows, Mac et Linux.

## Prérequis

- Node.js 18+ (https://nodejs.org)
- npm (inclus avec Node.js)

## Installation des dépendances

```bash
cd electron-app
npm install
```

## Développement

Lancer l'application en mode développement :

```bash
npm start
```

## Construction de l'installateur

### Windows (NSIS installer)

```bash
npm run dist:win
```

Le fichier `Le-Paradisier-Manager-Setup-2.0.0.exe` sera créé dans le dossier `dist/`.

### macOS (DMG)

```bash
npm run dist:mac
```

### Linux (AppImage)

```bash
npm run dist:linux
```

### Toutes les plateformes

```bash
npm run dist
```

## Structure du projet

```
electron-app/
├── main.js              # Processus principal Electron
├── preload.js           # Bridge sécurisé
├── package.json         # Configuration npm et electron-builder
├── LICENSE.txt          # Licence d'utilisation
├── GUIDE-INSTALLATION.md # Guide pour le client
├── build/               # Ressources de build (icônes)
│   └── icon.svg         # Icône source
└── app/                 # Application web
    ├── index.html       # Page principale
    ├── styles.css       # Styles
    └── js/              # Scripts JavaScript
        ├── storage.js   # Stockage IndexedDB
        ├── app-local.js # Application principale
        ├── modules.js   # Modules de gestion
        ├── modules-extra.js # Modules supplémentaires
        └── backup-settings.js # Sauvegarde et paramètres
```

## Création des icônes

Pour créer les icônes à partir du SVG :

### Windows (.ico)
Utilisez un convertisseur en ligne ou ImageMagick :
```bash
convert icon.svg -resize 256x256 icon.ico
```

### macOS (.icns)
```bash
mkdir icon.iconset
convert icon.svg -resize 16x16 icon.iconset/icon_16x16.png
convert icon.svg -resize 32x32 icon.iconset/icon_16x16@2x.png
convert icon.svg -resize 32x32 icon.iconset/icon_32x32.png
convert icon.svg -resize 64x64 icon.iconset/icon_32x32@2x.png
convert icon.svg -resize 128x128 icon.iconset/icon_128x128.png
convert icon.svg -resize 256x256 icon.iconset/icon_128x128@2x.png
convert icon.svg -resize 256x256 icon.iconset/icon_256x256.png
convert icon.svg -resize 512x512 icon.iconset/icon_256x256@2x.png
convert icon.svg -resize 512x512 icon.iconset/icon_512x512.png
convert icon.svg -resize 1024x1024 icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

### Linux (.png)
```bash
convert icon.svg -resize 512x512 icon.png
```

## Fonctionnalités

- ✅ Gestion des réservations
- ✅ Gestion du restaurant
- ✅ Base de données clients
- ✅ Tableau de bord avec statistiques
- ✅ Export/Import JSON
- ✅ Fonctionne 100% hors-ligne
- ✅ Données stockées localement (IndexedDB)
- ✅ Login local sécurisé

## Support

Email : contact@paradisier.mg

---

© 2024 Le Paradisier - Tous droits réservés
