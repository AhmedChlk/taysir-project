# Audit — Coordination des pages & vision dirigeant

> 2026-06-28. Après refonte UI/UX des pages Élèves, Planning, Présences, Groupes,
> Salles, Activités, Personnel, Settings. Cible : école privée algérienne, douleur
> n°1 = **recouvrement des scolarités**.

---

## A. Coordination & cohérence (entre pages)

**✅ Acquis (refonte)**
- Toutes les pages partagent le même socle : `PageHeader` éditorial, `StatCard` (KPIs), couleur réservée au statut, colonne **Occupation** montrant les dépendances, `hideDefaultAction` (plus de colonne dupliquée), delete subtil **désactivé si dépendances** (garde-fou FK).
- i18n complétée (parité fr/ar, 0 clé orpheline) → plus de clés brutes.
- Doublons seed dédupliqués (groupes, salles, activités).

**⚠️ À corriger**
1. **Pas de garde anti-doublon** : rien n'empêche de recréer 2 « Groupe A1 ». → contrainte d'unicité `(name, etablissementId)` ou validation à la création.
2. **Cross-links faibles** : depuis l'occupation d'une salle/activité on ne saute pas vers les séances ; depuis un groupe on n'atteint pas ses séances/élèves ; depuis un paiement on n'ouvre pas le profil élève. → liens contextuels.
3. **Métrique « Élèves inscrits » (Groupes)** = somme par groupe → **double-compte** un élève présent dans N groupes. Afficher aussi un effectif **distinct**.
4. **Cache** : `unstable_cache` (getStudents…) ne se revalide que via les actions de l'app — OK en usage normal ; éviter les écritures DB hors-app.
5. **Photos/documents** : upload dans `public/uploads` = **éphémère** (perdu au redéploiement Docker). → volume persistant ou stockage objet en prod.

---

## B. Vision dirigeant — ce qui ne va pas / manque

Le dirigeant veut, en 5 secondes : **combien j'ai encaissé, combien il me reste à recouvrer, qui n'a pas payé, qui est là aujourd'hui**. Aujourd'hui :

1. 🔴 **Pas de vraie relance WhatsApp/SMS.** `messages.actions.ts` = messagerie **interne en base** uniquement (send/received/sent). La landing **promet la relance WhatsApp** — non implémentée. C'est la fonction qui vend le produit sur le marché DZ.
2. 🟠 **Paiements peu actionnables** : pas d'**ancienneté des impayés** (aging 0-30/30-60/60+), pas de **relance 1 clic** réelle, reçu PDF non automatisé. KPIs financiers minces (`getFinancialKPIs` ≈ chiffre encaissé seul).
3. 🟠 **Tableau de bord** : doit être le poste de pilotage — encaissé/prévu/reste, **taux de recouvrement**, présents & séances du jour, **alertes**. À renforcer (vérifier que les chiffres sont réels et non statiques).
4. 🟠 **Présences sans conséquence** : absences répétées non remontées (alerte parent, taux d'assiduité par élève/groupe). Le pointage existe mais ne nourrit aucune alerte.
5. 🟠 **Pas de différenciation par rôle** : gérant / secrétaire / intervenant voient la même chose. Un **prof** devrait arriver sur *ses* séances + pointage ; une **secrétaire** sur caisse + inscriptions.
6. 🟠 **Aucun rapport/export** (Excel/PDF) des paiements, effectifs, assiduité — indispensable pour la compta et les parents.
7. 🟢 **Bon point** : le **Planning détecte déjà les conflits** salle / professeur / groupe (messages clairs). À garder et mettre en avant.

---

## C. Fonctions à ajouter — priorisé

### P0 — cœur métier (ce qui vend / retient)
1. **Relance WhatsApp réelle.** Minimum : bouton qui ouvre `wa.me` pré-rempli (« Bonjour, rappel : scolarité de X — Y DA avant le … »). Idéal : API WhatsApp Business / passerelle SMS DZ + **journal de relance** (qui, quand, statut).
2. **Vue recouvrement (Paiements)** : ancienneté des impayés, reste à recouvrer **par élève**, relance 1 clic, **reçu PDF auto** (le générateur existe déjà côté élève — à étendre au paiement).
3. **Tableau de bord dirigeant** : KPIs temps réel (encaissé / prévu / reste, taux de recouvrement, présents du jour, séances du jour) + **bandeau d'alertes**.

### P1 — valeur & rétention
4. **Alertes/notifications** : impayé en retard, séance sans prof/salle, élève absent N fois.
5. **Rapports/exports** Excel + PDF (paiements, effectifs, assiduité).
6. **Vues par rôle** (prof = mon planning/pointage ; secrétaire = caisse/inscriptions ; gérant = pilotage).
7. **Cross-links** contextuels entre pages (occupation → séances, groupe → élèves, paiement → profil).

### P2 — robustesse & scale
8. Contrainte d'unicité (groupes/salles/activités) — anti-doublon.
9. Stockage persistant photos/documents (prod).
10. Journal d'audit des actions (qui a encaissé/modifié/supprimé).
11. Portail / communication parents.

---

## Recommandation de séquence
**Paiements (P0-2)** d'abord — c'est le cœur métier et là où la valeur est la plus visible — en y branchant la **relance WhatsApp (P0-1)**, puis le **Tableau de bord dirigeant (P0-3)**. Le reste (alertes, exports, rôles) s'appuie dessus.
