# Taysir - Plateforme de Gestion Scolaire 🏫

## Vision & Architecture
Taysir est un ERP scolaire moderne conçu pour la sérénité. L'interface utilise la palette **Taysir Teal** (#0F515C) avec un design asymétrique Bento Box et des animations basées sur la physique des ressorts.

### Optimisations de Performance 🚀
*   **Requêtes Mémoïsées** : Utilisation de `React.cache` pour réduire les appels Redondants à `getServerSession`.
*   **Prisma Client Cache** : Les clients étendus pour le multi-tenant sont mis en cache pour éviter l'overhead de `$extends`.
*   **Indexation DB** : Index ajoutés sur les dates (`startTime`, `dueDate`, `date`) et IDs de tenant pour des requêtes instantanées.
*   **Standalone Mode** : Build Docker optimisé pour une empreinte VPS minimale.

---

## Guide d'Installation (Local)

### 1. Variables d'Environnement
Créez un fichier `.env` à la racine :
```env
# Database (PostgreSQL)
POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/taysir_db?schema=public"
POSTGRES_URL_NON_POOLING="postgresql://user:password@localhost:5432/taysir_db?schema=public"

# Authentification
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="générer-un-secret-ici"
```

### 2. Initialisation
```bash
npm install
npx prisma db push
npx prisma db seed
```

**Accès par défaut :**
- **Email** : `admin@taysir.dz`
- **Mot de passe** : `Taysir2026!`

### 3. Lancement
```bash
npm run dev
```

---

## Déploiement Production (Docker / VPS)

Le projet est 100% prêt pour Docker. Les migrations Prisma s'exécutent automatiquement au démarrage du conteneur.

### Lancement Rapide
```bash
docker compose up -d --build
```
### Initialisation de la Base 
Si les tables ne sont pas créées automatiquement, exécutez :

```bash
docker exec -it taysir-app npx prisma db push
docker exec -it taysir-app npx prisma db seed
```
### Configuration Docker Compose
Le fichier `docker-compose.yml` est configuré pour isoler la base de données (non accessible depuis l'extérieur) et utiliser un réseau interne pour une sécurité maximale.

---

## Stack Technique
- **Frontend** : Next.js 16 (App Router), Tailwind CSS v4, Framer Motion.
- **Backend** : Prisma 6, NextAuth, PostgreSQL.
- **i18n** : `next-intl` (Support FR/AR avec RTL).

---

