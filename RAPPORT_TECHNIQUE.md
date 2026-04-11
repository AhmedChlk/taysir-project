# RAPPORT TECHNIQUE - PROJET DE LICENCE 3 INFORMATIQUE

## Page de garde
**Titre du Projet** : Taysir - Plateforme de Gestion Scolaire Multi-Établissement  
**Membres de l'équipe** : Ahmed (Développeur Fullstack)  
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
7. Gestion de projet
8. Conclusion

---

## 1. Introduction
Dans le cadre de notre projet de fin d'année de Licence 3 Informatique, nous avons conçu et développé "Taysir", une solution logicielle innovante visant à moderniser et simplifier la gestion quotidienne des établissements scolaires. Les écoles d'aujourd'hui, qu'elles soient publiques ou privées, font face à une complexité croissante dans la gestion administrative, logistique et pédagogique. Le suivi des inscriptions, la planification des séances, la gestion des présences et le suivi financier nécessitent souvent de multiples outils hétérogènes, entraînant des pertes d'informations et d'efficacité.

L'objectif principal de ce projet est de centraliser toutes ces opérations au sein d'une seule et même application web, robuste, sécurisée et intuitive. L'application doit non seulement répondre aux besoins immédiats des directeurs, des secrétaires et des enseignants, mais aussi être conçue pour évoluer et potentiellement supporter plusieurs établissements de manière isolée (multi-tenancy). 

Ce rapport détaille les choix techniques, architecturaux et méthodologiques qui ont guidé la réalisation de Taysir.

---

## 2. Présentation de l'application et liste des fonctionnalités

Taysir est une application web (SaaS) conçue pour la gestion des écoles, centres de formation, ou académies.

### Fonctionnalités principales :
*   **Authentification et Autorisation** : Système de connexion sécurisé avec différents rôles (SuperAdmin, Gérant, Secrétaire, Intervenant, Participant).
*   **Gestion des Utilisateurs (Staff)** : Création, modification et désactivation des comptes du personnel enseignant et administratif.
*   **Logistique et Infrastructures** :
    *   Gestion des salles de classe (Capacité, équipements).
    *   Gestion des types d'activités (Matières enseignées, durée standard).
*   **Gestion Pédagogique** :
    *   Création de groupes (classes) assignés à une activité et un intervenant.
    *   Planification des séances (Emploi du temps).
    *   Suivi des présences et des retards pour chaque séance.
*   **Gestion Financière** : 
    *   Suivi des plans de paiement des élèves.
    *   Enregistrement des paiements reçus (Tranches payées ou partielles).
*   **Tableau de Bord** : Vue d'ensemble des statistiques de l'établissement (nombre d'élèves, séances du jour, taux de présence hebdomadaire).

---

## 3. Présentation de l'architecture logicielle

Nous avons opté pour une architecture **Client-Serveur** unifiée, s'appuyant sur le framework moderne **Next.js (App Router)**.

1.  **Frontend (Côté Client)** : L'interface utilisateur est développée en React.js, stylisée avec Tailwind CSS pour garantir un design réactif et moderne. Les composants sont découpés logiquement pour favoriser la réutilisabilité.
2.  **Backend (Côté Serveur)** : La logique métier et les accès à la base de données sont gérés via les **Server Actions** de Next.js. Cela permet de garder le code serveur proche des composants qui en ont besoin, tout en garantissant la sécurité (le code serveur n'est jamais envoyé au navigateur).
3.  **Base de Données** : Nous utilisons **PostgreSQL** comme SGBD relationnel, interfacé via **Prisma ORM**. Prisma nous assure une sécurité de typage (Type-Safety) de bout en bout, de la base de données jusqu'à l'interface graphique.

L'architecture suit les principes de la **Clean Architecture** dans la mesure du possible avec Next.js : séparation des couches de présentation (components), de logique d'interface (hooks), de traitement métier (actions) et d'accès aux données (services).

---

## 4. UML : Diagramme de classes et diagramme de séquence

### Diagramme de Classes
Le modèle de données s'articule autour de l'entité centrale `Etablissement` (Tenant), qui isole les données de chaque école.

*   `Etablissement` "possède" -> `User` (Staff), `Student` (Élèves), `Room` (Salles), `Activity` (Matières), `Group` (Classes).
*   `Group` "contient" -> `Student`. Un `Group` "est encadré par" un `User` (Intervenant).
*   `Session` (Séance) "se déroule dans" une `Room`, "concerne" un `Group` ou une `Activity`.
*   `AttendanceRecord` (Présence) "lie" un `Student` à une `Session`.
*   `PaymentPlan` (Contrat financier) "concerne" un `Student` et est composé de plusieurs `Tranche`s (échéances), qui reçoivent des `Paiement`s (flux financiers réels).

*(Note : Dans le code source, ce diagramme est implémenté via `prisma/schema.prisma`)*

### Diagramme de Séquence : Marquer la présence d'un étudiant
1.  **Enseignant** -> (Clique sur 'Présent') -> **Interface (Client)**
2.  **Interface (Client)** -> (Appelle `markPresenceAction(données)`) -> **Next.js (Serveur)**
3.  **Next.js (Serveur)** -> (Valide avec Zod)
4.  **Next.js (Serveur)** -> (Prisma `upsert` AttendanceRecord) -> **Base de données**
5.  **Base de données** -> (Confirme l'enregistrement) -> **Next.js (Serveur)**
6.  **Next.js (Serveur)** -> (Renvoie `{ success: true }`) -> **Interface (Client)**
7.  **Interface (Client)** -> (Affiche une notification de succès & actualise l'UI).

---

## 5. Patrons de conception (Design Patterns)

Dans ce projet, nous avons implémenté plusieurs Design Patterns pour rendre le code robuste et maintenable.

### 1. Pattern "Command" / Action Pattern (Implémentation via Server Actions)
*   **Localisation** : `src/actions/logistics.actions.ts`, `src/lib/actions/safe-action.ts`.
*   **Explication** : Au lieu d'avoir des API REST classiques éparpillées, nous encapsulons chaque intention de l'utilisateur (ex: "Créer un groupe", "Marquer une présence") dans une "Action" serveur isolée. Notre fonction utilitaire `createSafeAction` agit comme un "Invoker" qui vérifie automatiquement l'authentification et intercepte les erreurs, avant d'exécuter la logique métier concrète.
*   **Justification** : Cela permet de centraliser la gestion des erreurs, d'assurer que toutes les requêtes sont authentifiées sans dupliquer le code de vérification, et de garder un lien direct et fortement typé entre le bouton de l'UI et la base de données.

### 2. Pattern "Singleton" (Instance de la Base de données)
*   **Localisation** : `src/lib/prisma.ts`.
*   **Explication** : L'accès à la base de données via Prisma est géré de manière globale. Nous nous assurons qu'une seule instance du PrismaClient est créée pendant le cycle de vie de l'application (particulièrement important en développement avec le rechargement à chaud de Next.js).
*   **Justification** : Évite l'épuisement du pool de connexions à PostgreSQL. Si nous instancions un nouveau client à chaque requête, la base de données saturerait immédiatement.

---

## 6. Outils de développement (Git et Docker)

### Gestion de version avec Git
Nous avons utilisé **Git** et hébergé le projet sur **GitHub**.
*   Utilisation de commits réguliers pour isoler les ajouts de fonctionnalités (ex: "feat: ajout gestion des présences", "fix: correction bouton ajout de groupe").
*   Mise en place d'un historique clair permettant le suivi de l'évolution du projet.

### Conteneurisation avec Docker
L'application est entièrement conteneurisée pour garantir que le projet tourne de la même manière sur l'ordinateur du développeur, de l'enseignant évaluateur, et sur le serveur de production.
*   **Dockerfile** : Définit l'image de l'application Next.js. Nous utilisons une approche *multi-stage build* (dépendances, builder, runner) pour obtenir une image finale très légère basée sur `node:alpine`.
*   **docker-compose.yml** : Orchestre l'application et sa base de données PostgreSQL. Cela permet de lancer tout l'environnement (app + BDD) avec une seule commande : `docker compose up --build`.

---

## 7. Gestion de projet

La gestion des tâches s'est faite via une approche Agile simplifiée.

| Tâche | Assigné à | Durée Estimée | Difficultés & Choix |
| :--- | :--- | :--- | :--- |
| **Setup & Architecture** | Ahmed | 3 Jours | Choix entre Next.js et React classique. Choix de Next.js App Router pour de meilleures perfs. Mise en place de Docker complexe avec Next standalone. |
| **Authentification & DB** | Ahmed | 5 Jours | Gestion des sessions avec NextAuth. Implémentation du multi-tenancy (séparer les données par établissement) avec Prisma via un pattern d'extension (`getTenantPrisma`). |
| **UI/UX & Traductions** | Ahmed | 7 Jours | Support de l'Arabe (RTL). Difficulté à configurer `next-intl` avec l'App Router pour gérer le RTL dynamiquement. Choix de Tailwind pour la rapidité. |
| **CRUD Logistique & Pédagogie**| Ahmed | 6 Jours | Lier les groupes, activités et enseignants. Le composant Modal nécessitait de bien gérer l'état local (`isPending`) pour éviter les soumissions multiples. |
| **Dashboard & Graphiques** | Ahmed | 4 Jours | Générer les stats de fréquentation. Difficulté: grouper les présences par jour. Choix d'utiliser `date-fns` pour simplifier les calculs de dates. |

---

## 8. Conclusion

Le développement du projet "Taysir" a été une expérience formatrice majeure. Elle nous a permis d'appliquer concrètement les concepts vus en cours (modélisation de base de données, patrons de conception, principes SOLID) tout en nous confrontant aux réalités du développement moderne (Framework fullstack, ORM, conteneurisation Docker, gestion de version).

L'application finalisée est fonctionnelle, testable et prête à être déployée. Bien qu'il reste des pistes d'amélioration (ajout de tests unitaires plus poussés, optimisation du cache), les objectifs initiaux fixés au début du projet sont largement atteints.
