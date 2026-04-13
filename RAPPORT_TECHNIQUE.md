# PROJET DE GÉNIE LOGICIEL - L3 INFORMATIQUE

**Titre du Projet** : TAYSIR - Plateforme de Gestion Scolaire Multi-Établissement  
**Formation** : Licence 3 Informatique — Semestre 6  
**Année Universitaire** : 2025-2026  
**Établissement** : Université de Perpignan Via Domitia (UPVD)

**Membres de l'équipe** :
*   **Ahmed Choulak** (Backend, Architecture, Base de données)
*   **Amine Moulai** (Frontend, UI/UX, Internationalisation)

**Date de rendu** : Dimanche 12 avril 2026  
**Enseignant responsable** : Benjamin ANTUNES

---

## Sommaire
1. [Introduction](#1-introduction)
2. [Présentation de l'application](#2-présentation-de-lapplication)
    *   2.1. [Contexte](#21-contexte)
    *   2.2. [Liste des fonctionnalités](#22-liste-des-fonctionnalités)
3. [Architecture Logicielle](#3-architecture-logicielle)
    *   3.1. [Choix technologiques](#31-choix-technologiques)
    *   3.2. [Structure de l'application](#32-structure-de-lapplication)
    *   3.3. [Modèle Multi-Tenancy (Isolation des données)](#33-modèle-multi-tenancy-isolation-des-données)
4. [Modélisation UML](#4-modélisation-uml)
    *   4.1. [Diagramme de Classes](#41-diagramme-de-classes)
    *   4.2. [Diagramme de Séquence](#42-diagramme-de-séquence)
5. [Patrons de Conception (Design Patterns)](#5-patrons-de-conception-design-patterns)
6. [Outils de Génie Logiciel](#6-outils-de-génie-logiciel)
    *   6.1. [Gestion de version (Git)](#61-gestion-de-version-git)
    *   6.2. [Conteneurisation (Docker)](#62-conteneurisation-docker)
7. [Gestion de Projet et Répartition des Tâches](#7-gestion-de-projet-et-répartition-des-tâches)
8. [Détails des Tâches : Difficultés et Choix](#8-détails-des-tâches--difficultés-et-choix)
9. [Conclusion](#9-conclusion)

---

## Table des figures
*   *Figure 1* : Architecture globale de Taysir.
*   *Figure 2* : Schéma relationnel de la base de données.
*   *Figure 3* : Diagramme de classes UML.
*   *Figure 4* : Diagramme de séquence - Processus de règlement d'une tranche.
*   *Figure 5* : Workflow du build multi-stage Docker.

---

## 1. Introduction
Dans le cadre de l'UE Génie Logiciel de Licence 3, nous avons développé **Taysir**, une application web SaaS (Software as a Service) destinée à la gestion des établissements scolaires. L'objectif est de fournir un outil unique capable de gérer l'ensemble des besoins administratifs et pédagogiques d'une école, tout en offrant une architecture robuste permettant d'héberger plusieurs écoles de manière totalement isolée sur la même plateforme.

Ce projet met en application les principes fondamentaux du génie logiciel : modélisation rigoureuse, utilisation de patrons de conception, gestion de versions collaborative et conteneurisation pour la reproductibilité.

---

## 2. Présentation de l'application

### 2.1. Contexte
La gestion d'une école moderne implique une multitude de tâches complexes : suivi des inscriptions, création d'emplois du temps cohérents, gestion des absences et pilotage financier. Taysir centralise ces besoins dans une interface intuitive inspirée des principes du design "Bento Box" et de la "Spring Physics" pour les interactions, offrant une expérience utilisateur fluide et professionnelle.

### 2.2. Liste des fonctionnalités
*   **Administration & Sécurité** : Authentification via NextAuth.js, gestion des rôles (Admin, Gérant, Enseignant, Secrétaire).
*   **Gestion du Staff** : Registre complet du personnel avec suivi des comptes actifs.
*   **Logistique Pédagogique** :
    *   Gestion des salles (nom, capacité).
    *   Gestion des types d'activités (matières, durée).
    *   Groupes d'élèves (classes).
*   **Planning Interactif** : Calendrier dynamique permettant de planifier des séances uniques ou hebdomadaires (récursion sur 52 semaines).
*   **Suivi des Présences** : Pointage numérique des élèves avec gestion des retards et des notes pédagogiques.
*   **Gestion Financière (Échéanciers)** :
    *   Création de plans financiers personnalisés pour chaque élève.
    *   Découpage automatisé en tranches mensuelles.
    *   Suivi visuel de l'avancement des paiements ("Timeline").
*   **Dashboard Décisionnel** : Statistiques en temps réel sur la fréquentation, les recettes financières et les séances du jour.

---

## 3. Architecture Logicielle

### 3.1. Choix technologiques
*   **Framework** : **Next.js 16** (App Router). Choix motivé par les performances du Server-Side Rendering (SSR) et la simplicité des Server Actions.
*   **Langage** : **TypeScript strict**. Garantit la sécurité de typage et réduit drastiquement les erreurs au runtime.
*   **ORM** : **Prisma**. Permet une manipulation de la base de données via des objets TypeScript, assurant une cohérence parfaite entre le schéma DB et le code.
*   **Base de Données** : **PostgreSQL**. Fiabilité et robustesse pour les données relationnelles complexes.
*   **UI** : **Tailwind CSS** & **Lucide React**. Pour un design modulaire, réactif et accessible.

### 3.2. Structure de l'application
L'application suit une architecture en couches simplifiée :
1.  **Couche Présentation (Vues)** : Composants React (`src/components`) utilisant des hooks pour l'état local.
2.  **Couche Logique Métier (Actions)** : Server Actions (`src/actions`) encapsulant les règles métier et les validations Zod.
3.  **Couche Données (Services)** : Fonctions d'accès aux données (`src/services`) pour les lectures optimisées côté serveur.
4.  **Couche Persistance** : Modèles Prisma et base de données PostgreSQL.

### 3.3. Modèle Multi-Tenancy (Isolation des données)
L'une des forces de Taysir est son isolation par "Tenant" (établissement). Chaque requête effectuée vers la base de données est automatiquement filtrée par l'ID de l'établissement de l'utilisateur connecté via une extension Prisma (`getTenantPrisma`). Cela empêche toute fuite de données entre deux écoles utilisant la même plateforme.

---

## 4. Modélisation UML

### 4.1. Diagramme de Classes
Le diagramme de classes s'articule autour de l'entité `Etablissement`.
*   Un **Etablissement** possède plusieurs **User**, **Room**, **Activity**, **Groupe**, **Student**.
*   Un **Student** appartient à un ou plusieurs **Groupe**.
*   Une **Session** (Séance) lie une **Activity**, une **Room**, un **User** (intervenant) et un **Groupe**.
*   Un **Student** possède un **PaymentPlan**, composé de plusieurs **Tranche**. Chaque **Tranche** peut recevoir plusieurs **Paiement**.
*   Le pointage est géré par **AttendanceRecord**, liant un **Student** à une **Session**.

### 4.2. Diagramme de Séquence : Règlement d'une tranche mensuelle
Le processus suit le flux suivant :
1.  **Gérant** : Sélectionne une tranche dans l'échéancier de l'élève et clique sur "Valider".
2.  **Client (React)** : Appelle `registerPaymentAction` avec l'ID de la tranche et le montant.
3.  **Serveur (Next.js)** :
    *   Vérifie l'ID de l'établissement.
    *   Démarre une transaction atomique.
    *   Crée l'enregistrement `Paiement`.
    *   Met à jour le statut de la `Tranche` (si montant atteint).
    *   Recalcule et met à jour le statut global du `PaymentPlan`.
4.  **Base de Données** : Valide la transaction.
5.  **Serveur** : Revalide le cache (`revalidateTag`).
6.  **Client** : Actualise l'interface et affiche le succès.

---

## 5. Patrons de Conception (Design Patterns)

### 1. Pattern Command (Actions Serveur)
Chaque interaction modifiant l'état du système est encapsulée dans une "Action" (`createSafeAction`). Ce pattern permet de découpler l'interface utilisateur de la logique de traitement et facilite la gestion centralisée des erreurs et de la sécurité.

### 2. Pattern Singleton (Prisma Client)
La connexion à la base de données est gérée par une instance unique partagée dans toute l'application. Cela évite la saturation du pool de connexions PostgreSQL, crucial dans un environnement de déploiement Serverless ou Edge.

### 3. Pattern Proxy / Extension (Isolation Tenant)
L'accès à Prisma est "proxifié" par une fonction qui injecte systématiquement le filtre de l'établissement. Cela agit comme un garde-fou garantissant que même si un développeur oublie une clause `where`, les données restent isolées.

---

## 6. Outils de Génie Logiciel

### 6.1. Gestion de version (Git)
Nous avons adopté une stratégie de commits sémantiques (feat, fix, chore, docs) pour maintenir un historique clair. Le développement a été étalé sur un mois avec une répartition claire des responsabilités entre le Front et le Back.

### 6.2. Conteneurisation (Docker)
L'utilisation de Docker garantit la parité entre les environnements de développement et de production.
*   **Multi-stage build** : Notre Dockerfile sépare l'installation des dépendances, la compilation (`next build`) et l'exécution, produisant une image optimisée.
*   **Docker Compose** : Permet de monter instantanément l'application et sa base de données avec une seule commande.

---

## 7. Gestion de Projet et Répartition des Tâches

| Semaine | Tâches Ahmed (Back/Arch) | Tâches Amine (Front/UX) |
| :--- | :--- | :--- |
| **S1** | Init Projet, Schéma DB Prisma, Docker | Layout Dashboard, Design System, i18n |
| **S2** | Auth NextAuth, Multi-tenancy isolation | Vues Staff & Élèves, Modales CRUD |
| **S3** | Actions Logistiques, API Planning | Calendrier interactif, Filtres dynamiques |
| **S4** | Logique financière, Échéanciers, Tests | Dashboard Stats, UI Échéancier Mensuel |

---

## 8. Détails des Tâches : Difficultés et Choix

*   **Gestion des Dates et Fuseaux horaires** : La planification hebdomadaire a posé des difficultés sur le calcul des récurrences (passage à l'heure d'été/hiver). Nous avons choisi `date-fns` pour sa robustesse.
*   **Internationalisation (Arabe/Français)** : Le passage au mode RTL (Right-To-Left) pour l'Arabe a nécessité une refonte de certains composants Tailwind asymétriques. Nous avons utilisé `next-intl`.
*   **Synchronisation des Paiements** : Assurer que le statut global d'un plan de paiement ("Payé", "Partiel") soit toujours cohérent avec la somme des tranches. Choix d'utiliser des **Transactions Prisma** pour garantir l'atomicité.

---

## 9. Conclusion
Le projet **Taysir** démontre qu'une approche rigoureuse basée sur le Génie Logiciel permet de construire une application complexe, sécurisée et évolutive en un temps record. La combinaison de Next.js, Prisma et Docker offre une base solide pour un produit SaaS moderne. Les objectifs pédagogiques ont été remplis, notamment sur la maîtrise des patrons de conception et de la conteneurisation.
