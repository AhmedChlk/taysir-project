# RAPPORT TECHNIQUE - PROJET DE LICENCE 3 INFORMATIQUE

## Page de garde
**Titre du Projet** : Taysir - Plateforme de Gestion Scolaire Multi-Établissement  
**Membres de l'équipe** : 
- Ahmed (Développement Backend, DevOps & Architecture)
- Amine MOULAI (Développement Fullstack, UI/UX & Intégration)  
**Date** : 12 Avril 2026  
**Formation** : L3 Informatique  

---

## Sommaire
1. Introduction
2. Présentation de l'application et liste des fonctionnalités
3. Présentation de l'architecture logicielle
4. UML : Diagramme de classes et diagramme de séquence
5. Patrons de conception (Design Patterns)
6. Outils de développement (Git et Docker)
7. Gestion de projet et Répartition des Tâches
8. Défis techniques, Problèmes non résolus et Approches
9. Bilan : Points forts et Axes d'amélioration
10. Conclusion

---

## 1. Introduction
Dans le cadre de notre projet de fin d'année de Licence 3 Informatique, nous avons conçu et développé "Taysir", une solution logicielle innovante visant à moderniser et simplifier la gestion quotidienne des établissements scolaires. Les écoles d'aujourd'hui, qu'elles soient publiques ou privées, font face à une complexité croissante dans la gestion administrative, logistique et pédagogique. 

L'objectif principal de ce projet est de centraliser toutes ces opérations au sein d'une seule et même application web, robuste, sécurisée et intuitive. L'application doit non seulement répondre aux besoins immédiats du personnel, mais aussi être conçue pour évoluer et supporter plusieurs établissements de manière isolée (multi-tenancy). 

---

## 2. Présentation de l'application et liste des fonctionnalités
Taysir est une application web (SaaS) conçue pour la gestion globale des écoles ou académies.

### Fonctionnalités principales :
* **Authentification et Autorisation** : Système de connexion sécurisé avec différents rôles (SuperAdmin, Gérant, Secrétaire, Intervenant, Participant).
* **Gestion des Utilisateurs (Staff)** : Création et gestion des comptes du personnel.
* **Logistique et Infrastructures** : Gestion des salles de classe et des types d'activités.
* **Gestion Pédagogique** : Création de groupes, planification des séances, suivi des présences et des retards.
* **Gestion Financière** : Suivi des plans de paiement, gestion des tranches et historique des encaissements.
* **Tableau de Bord** : Vue d'ensemble statistique (fréquentation, agenda, revenus).

---

## 3. Présentation de l'architecture logicielle
Nous avons opté pour une architecture **Client-Serveur** unifiée, s'appuyant sur le framework **Next.js (App Router)**.

1.  **Frontend (Côté Client)** : Interface développée en React.js, stylisée avec Tailwind CSS pour un design réactif.
2.  **Backend (Côté Serveur)** : La logique métier est gérée via les **Server Actions** de Next.js, garantissant une sécurité optimale.
3.  **Base de Données** : Utilisation de **PostgreSQL** interfacé via l'ORM **Prisma**, assurant une sécurité de typage (Type-Safety) de bout en bout.

---

## 4. Patrons de conception (Design Patterns)

### 1. Pattern "Command" / Action Pattern (Server Actions)
Au lieu d'API REST classiques, nous encapsulons chaque intention utilisateur (ex: "Créer un groupe") dans une "Action" serveur. Notre utilitaire `createSafeAction` agit comme un *Invoker* qui vérifie l'authentification et intercepte les erreurs avant d'exécuter la logique métier.

### 2. Pattern "Singleton" (Instance Prisma)
L'accès à la base de données est géré via un Singleton (`src/lib/prisma.ts`). Cela garantit qu'une seule instance du PrismaClient est créée, évitant ainsi l'épuisement du pool de connexions à PostgreSQL lors des rechargements à chaud en phase de développement.

---

## 5. Outils de développement (Git et Docker)

* **Git / GitHub** : Utilisation d'un historique de commits sémantiques (feat, fix, chore) pour tracer l'évolution du projet de manière chronologique.
* **Docker** : Conteneurisation de l'application (Next.js) et de la base de données (PostgreSQL) via `docker-compose.yml`, assurant une parité parfaite entre les environnements de développement et de production.

---

## 6. Gestion de projet et Répartition des Tâches

Le travail a été réparti de manière équitable en fonction des appétences de chacun, tout en collaborant étroitement sur les points de friction.

| Responsabilité | Tâches principales (basées sur l'historique Git) | Assurées par |
| :--- | :--- | :--- |
| **Infrastructure & Architecture** | Init Next.js, configuration Docker, mise en place du schéma Prisma (Multi-tenant) et de la base PostgreSQL. | Ahmed |
| **UI/UX & Composants Réutilisables** | Design system (Tailwind), création des Modales, DataTables, et Layout du Dashboard. | Amine |
| **Logique Pédagogique & Sécurité** | Server Actions de base, middleware de sécurité, gestion des routes et du proxy. | Ahmed |
| **Intégration & Flux de données** | Liaison des formulaires aux Server Actions, implémentation du module Financier, hachage Bcrypt. | Amine |
| **Internationalisation (i18n)** | Support multilingue (Français/Arabe) avec gestion du sens de lecture (RTL). | Amine |
| **Debugging Complexe** | Résolution du Singleton Prisma, fix de la sérialisation JSON/Dates des RSC, compatibilité Turbopack. | Amine & Ahmed |

---

## 7. Défis techniques, Problèmes non résolus et Approches

Au cours du développement, nous avons été confrontés à plusieurs limitations techniques inhérentes aux technologies récentes choisies :

### Défis rencontrés et approches utilisées :
1.  **Sérialisation des objets `Date` entre Serveur et Client** : Les Server Components de Next.js (RSC) ne permettent pas de passer directement des objets complexes (comme des `Date` issues de Prisma) aux composants clients. *Approche :* Nous avons développé une fonction utilitaire `purify(JSON.parse(JSON.stringify(data)))` pour normaliser les données avant leur transmission.
2.  **Fuite de connexions Base de données** : En mode développement, le rechargement à chaud créait des instances Prisma en boucle, saturant PostgreSQL. *Approche :* Mise en place stricte du pattern Singleton global (`globalThis.prisma`).
3.  **Compatibilité Turbopack / Server Actions** : Nous voulions utiliser le nouveau bundler Turbopack pour accélérer le développement, mais il gérait mal certaines résolutions d'imports avec les Server Actions. *Approche :* Ajustement de la configuration expérimentale dans `next.config.js` et restructuration des imports pour stabiliser l'environnement.

### Problèmes non résolus (Dette technique assumée) :
* **Mise en cache avancée (React Cache / Next.js tags)** : Bien que nous utilisions `revalidatePath` et `revalidateTag`, l'optimisation fine du cache côté client pour réduire au maximum les requêtes en base de données n'est pas encore parfaite.
* **Couverture de tests automatisés** : Par manque de temps sur le semestre, nous avons privilégié les tests manuels et la sécurisation via le typage (TypeScript/Zod). Il manque une suite de tests End-to-End (ex: Cypress) pour valider les flux complexes de paiement.

---

## 8. Bilan : Points forts et Axes d'amélioration

### Points Forts de la solution :
* **Architecture Multi-Tenant (SaaS)** : La base de données est conçue pour isoler les données (`etablissementId`), permettant d'héberger plusieurs écoles sur la même instance sans fuite de données.
* **Type-Safety intégrale** : L'utilisation conjointe de TypeScript, Prisma et Zod garantit que les données saisies par l'utilisateur correspondent exactement à ce qui est attendu en base, réduisant les bugs d'exécution à quasi zéro.
* **Déploiement Conteneurisé** : L'application est "Production-Ready" grâce à Docker.

### Axes d'amélioration futurs :
* Implémenter un système de notifications en temps réel (WebSockets / Socket.io) pour alerter les parents d'un retard ou d'un paiement exigible.
* Ajouter un pipeline CI/CD (GitHub Actions) pour automatiser le build Docker et les vérifications de type à chaque `push`.
* Passer d'une gestion des états locaux à un gestionnaire plus robuste (Zustand ou Redux) si les interfaces deviennent plus complexes (ex: module d'emploi du temps drag-and-drop).

---

## 9. Conclusion
Le développement du projet "Taysir" a été une expérience formatrice majeure. Elle nous a permis d'appliquer concrètement les concepts vus en cours (modélisation de base de données, patrons de conception) tout en nous confrontant aux défis réels du développement web moderne (Framework fullstack asynchrone, ORM, conteneurisation Docker, résolution de conflits Git).

L'application finalisée constitue un Produit Minimum Viable (MVP) solide. La complémentarité de notre équipe, séparant clairement les responsabilités d'architecture d'un côté et d'intégration applicative de l'autre, nous a permis de surmonter les obstacles techniques et de livrer une solution professionnelle respectant le cahier des charges.