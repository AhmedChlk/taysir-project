# Taysir - Gestion de Scolarité

**Projet Universitaire - L3 Informatique**

Taysir est une plateforme SaaS de gestion pour les établissements scolaires. Ce projet a été développé dans le cadre de la Licence 3 Informatique. Il permet de gérer les inscriptions, les plannings, les présences et les paiements des élèves au sein d'une ou plusieurs écoles.

## Prérequis Système

Pour faire fonctionner ce projet, vous devez avoir installé sur votre machine :
*   **Docker** et **Docker Compose**
*   **Node.js** (v20 ou supérieure) - *Optionnel, si vous voulez lancer sans Docker.*
*   **Git**

## Structure du projet

```
taysir/
├── src/                # Code source de l'application React/Next.js
│   ├── actions/        # Logique métier serveur (Command Pattern)
│   ├── app/            # Pages de l'application (App Router)
│   ├── components/     # Composants React réutilisables
│   └── lib/            # Fichiers utilitaires, configuration DB (Singleton)
├── prisma/             # Schéma de la base de données et scripts de seed
├── public/             # Images et assets statiques
├── docker-compose.yml  # Configuration Docker pour l'environnement
├── Dockerfile          # Configuration de l'image de l'application
└── RAPPORT_TECHNIQUE.md # Rapport détaillé du projet
```

## Instructions d'installation et de lancement (Recommandé : via Docker)

L'application est entièrement conteneurisée. Il suffit d'une seule commande pour lancer l'application et la base de données.

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/ahmed/taysir-project.git
    cd taysir-project/taysir-front
    ```

2.  **Lancer avec Docker Compose :**
    ```bash
    docker compose up --build -d
    ```
    *Cette commande va télécharger l'image PostgreSQL, construire l'image Next.js, installer les dépendances et démarrer les deux conteneurs en arrière-plan.*

3.  **Accéder à l'application :**
    Ouvrez votre navigateur et allez sur : [http://localhost:3000](http://localhost:3000)

4.  **Initialiser la base de données (Seed) :**
    La première fois, pour avoir des données de test (utilisateurs, écoles), exécutez la commande suivante dans le conteneur web :
    ```bash
    docker compose exec web npx prisma db push
    docker compose exec web npm run prisma:seed
    ```

### Arrêter l'application
Pour stopper les conteneurs :
```bash
docker compose down
```

## Lancer l'application sans Docker (Mode local)

Si vous préférez ne pas utiliser Docker, vous aurez besoin d'une base de données PostgreSQL locale.

1.  Copiez le fichier `.env.local` (ou modifiez le `.env`) pour pointer vers votre base de données locale.
2.  Installez les dépendances : `npm install`
3.  Initialisez la base de données : `npx prisma db push`
4.  Générez le client : `npx prisma generate`
5.  Lancez le serveur : `npm run dev`

## Tests

L'application inclut des tests (via Vitest et React Testing Library). Pour les lancer localement :
```bash
npm run test
```

## Identifiants de test
Lors de l'utilisation des données de test (seed), vous pouvez vous connecter avec :
*   **Email** : admin@taysir.dz
*   **Mot de passe** : admin123
