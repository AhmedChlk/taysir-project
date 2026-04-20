# Taysir - Plateforme de Gestion Scolaire 🏫

## Vision & Architecture
Taysir est un ERP scolaire moderne conçu pour être robuste, sécurisé (Multi-Tenant) et extrêmement léger en ressources.

### Optimisations de Performance & Infrastructure 🚀
* **CIBLE DE DÉPLOIEMENT : VPS ORACLE FREE TIER.** Le projet est conçu pour tourner sur un environnement très contraint en ressources (ex: 1 Go de RAM). 
* **INTERDICTION D'UTILISER VERCEL :** Le code ne doit dépendre d'aucune infrastructure Serverless propriétaire. Tout doit fonctionner dans un environnement Node.js classique.
* **Standalone Mode** : Build Docker optimisé (`output: "standalone"` dans `next.config.ts`) pour une empreinte mémoire minimale.
* **Requêtes Mémoïsées** : Utilisation de `React.cache` pour limiter la charge sur la base de données PostgreSQL.

---

## Guide d'Installation & Déploiement

### Déploiement Production (Docker / Oracle VPS)
Le projet est 100% prêt pour Docker. Les migrations Prisma s'exécutent au démarrage.

```bash
docker compose up -d --build
```

Si les tables ne sont pas créées automatiquement, exécutez l'initialisation dans le conteneur :
```bash
docker exec -it taysir-app npx prisma db push
docker exec -it taysir-app npx prisma db seed
```
### 2. `AUDIT_TODO.md` (Le plan d'attaque étape par étape)
On réinitialise les cases cochées et on impose une règle stricte : l'agent doit corriger les bugs **un par un**.

```markdown
# TAYSIR — AUDIT COMPLET & TODO REFACTORING

> État Actuel : L'application contient de multiples erreurs, de logique et d'incohérences (notamment sur le nouveau module SuperAdmin).


## ⚠️ RÈGLE DE TRAVAIL POUR L'AGENT 
Tu DOIS faire un audit et corriger les problèmes **STRICTEMENT UN PAR UN**. 
Interdiction de modifier 15 fichiers en même temps. Tu répares un composant, tu testes , et tu passes au suivant.
