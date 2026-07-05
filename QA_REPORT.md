# QA_REPORT.md — Gestionnaire de tâches

## 1. Présentation du projet

- **Thème choisi** : Gestionnaire de tâches (Thème 1)
- **Objectif** : permettre à un utilisateur de créer des tâches, de suivre leur statut et leur
  priorité, et de visualiser automatiquement les tâches en retard et urgentes.
- **Stack utilisée** : Node.js + Express (backend et API), stockage en mémoire, HTML/CSS/JS
  vanilla (frontend), Vitest + Supertest (tests unitaires et d'intégration), Playwright (E2E),
  GitHub Actions (CI/CD).
- **Fonctionnalités principales** : création de tâche, changement de statut, calcul du retard,
  comptage des tâches en retard, tri automatique par urgence.

## 2. Fonctionnalités développées

- Création d'une tâche (titre, priorité, date d'échéance) avec validation.
- Changement de statut d'une tâche (`à faire` → `en cours` → `terminée`), avec blocage d'une
  transition interdite.
- Détection automatique du retard d'une tâche.
- Comptage du nombre de tâches en retard.
- Tri de la liste des tâches par urgence (en retard + priorité haute en premier).
- Interface web simple permettant de créer une tâche et de voir la liste se mettre à jour.

Le périmètre a été volontairement limité (pas de suppression de tâche, pas d'édition du titre
après création, pas d'authentification) pour garder un projet complet, testé et documenté plutôt
qu'un projet plus large mais partiellement couvert.

## 3. Règles métier principales

| # | Règle |
|---|---|
| 1 | Une tâche sans titre (vide ou espaces uniquement) est invalide. |
| 2 | La priorité doit appartenir à la liste autorisée : `basse`, `moyenne`, `haute`. Par défaut : `moyenne`. |
| 3 | Une tâche est "en retard" si sa date d'échéance est strictement antérieure à aujourd'hui **et** que son statut n'est pas `terminée`. Une tâche due aujourd'hui n'est pas en retard. |
| 4 | Une tâche `terminée` ne peut pas repasser directement à `à faire` ; elle doit d'abord repasser par `en cours`. |
| 5 | Dans la liste des tâches, celles à la fois en retard et de priorité `haute` sont affichées en premier. |

## 4. Démarche TDD

Cinq cycles TDD ont été menés sur la logique métier (`src/domain/taskService.js`), soit plus que
le minimum de 3 demandé. Chaque cycle a été vérifié par une exécution réelle des tests.

### Cycle 1 — Titre obligatoire

- **Comportement attendu** : une tâche sans titre doit être rejetée.
- **Test écrit** : `createTask({ title: '' })` doit lever `"Le titre est obligatoire"`.
- **Résultat initial** : échec — le module `taskService.js` n'existait pas encore.
- **Code ajouté** : fonction `createTask` avec validation du titre (`trim()` + vérification de vacuité).
- **Résultat final** : succès.

### Cycle 2 — Priorité valide

- **Comportement attendu** : la priorité doit appartenir à `basse`, `moyenne`, `haute` ; une
  valeur par défaut (`moyenne`) s'applique si aucune n'est fournie.
- **Test écrit** : 3 tests — priorité invalide rejetée, priorité valide acceptée, priorité par
  défaut appliquée.
- **Résultat initial** : 3 échecs — la validation n'existait pas.
- **Code ajouté** : liste `ALLOWED_PRIORITIES`, valeur par défaut, vérification dans `createTask`.
- **Résultat final** : succès (4 tests passants sur le fichier).

### Cycle 3 — Détection du retard

- **Comportement attendu** : une tâche non terminée dont la date d'échéance est passée est "en
  retard" ; une tâche terminée ne l'est jamais ; une tâche due aujourd'hui ne l'est pas non plus.
- **Test écrit** : 4 tests — cas nominal (en retard), tâche terminée non en retard, tâche due
  aujourd'hui non en retard (cas limite), absence de date d'échéance (cas d'erreur).
- **Résultat initial** : 4 échecs — fonction `isOverdue` inexistante.
- **Code ajouté** : fonction `isOverdue` avec normalisation des dates à minuit pour éviter les
  effets de bord liés à l'heure, et rejet explicite si `dueDate` est absente.
- **Résultat final** : succès (8 tests passants sur le fichier).

### Cycle 4 — Transition de statut interdite

- **Comportement attendu** : une tâche `terminée` ne peut pas repasser directement à `à faire`.
- **Test écrit** : 3 tests — transition autorisée (cas nominal), transition interdite (cas
  d'erreur métier), statut inexistant (cas d'erreur technique).
- **Résultat initial** : 3 échecs — fonction `updateTaskStatus` inexistante.
- **Code ajouté** : fonction `updateTaskStatus` avec liste de statuts autorisés et règle de
  blocage spécifique `terminée → à faire`.
- **Résultat final** : succès (11 tests passants sur le fichier).

### Cycle 5 — Tri par urgence

- **Comportement attendu** : les tâches en retard et de priorité haute apparaissent en premier
  dans la liste.
- **Test écrit** : 3 tests — cas nominal (une tâche urgente remonte), cas limite (aucune tâche
  urgente, ordre inchangé), cas limite (liste vide).
- **Résultat initial** : 3 échecs — fonction `sortTasksByUrgency` inexistante.
- **Code ajouté** : fonction `sortTasksByUrgency` utilisant un tri stable basé sur un score
  d'urgence binaire.
- **Résultat final** : succès (14 tests passants sur le fichier).

Une fonction complémentaire, `countOverdueTasks`, a ensuite été ajoutée avec ses propres tests
(cas nominal et liste vide) pour un total de **16 tests unitaires**.

## 5. Stratégie de tests

- **Tests unitaires** : ciblent la logique métier pure dans `taskService.js`, indépendamment de
  l'API et du stockage. Ils couvrent systématiquement un cas nominal, un cas limite et un cas
  d'erreur pour chaque règle métier. C'est le niveau le plus rapide et le plus précis pour
  vérifier une règle isolée.
- **Tests d'intégration** : vérifient que la route API, la validation et le stockage en mémoire
  fonctionnent ensemble (ex : `POST /api/tasks` retourne bien un 201 avec le bon corps de
  réponse, ou un 400 avec le bon message d'erreur). Ils vérifient aussi des comportements qui
  n'existent qu'au niveau de la route, comme l'obligation d'une date d'échéance.
- **Test E2E** : simule un vrai parcours utilisateur dans le navigateur (créer une tâche via le
  formulaire et la voir apparaître dans la liste), ce qui n'est vérifiable ni par les tests
  unitaires ni par les tests d'intégration seuls, car ils ne passent pas par le rendu HTML/JS
  réel.
- **Ce qui est couvert** : toutes les règles métier listées en section 3, les principaux
  endpoints de l'API (création, listing, changement de statut, comptage), un parcours de
  création de tâche de bout en bout, et un parcours d'erreur (titre vide) en E2E.
- **Ce qui n'est pas couvert** : la suppression de tâches (fonctionnalité non développée), la
  persistance des données au redémarrage du serveur (stockage en mémoire, volontairement), les
  tests de charge/performance, l'accessibilité (non testée formellement).

## 6. Tests unitaires réalisés

Fichier : `tests/unit/taskService.test.js` — **16 tests**, répartis en 5 groupes correspondant
aux 5 règles métier (voir section 4) plus la fonction de comptage. Chaque groupe contient au
moins un cas nominal, un cas limite et un cas d'erreur lorsque c'est pertinent.

## 7. Tests d'intégration réalisés

Fichier : `tests/integration/taskRoutes.test.js` — **9 tests** avec Supertest, contre
l'application Express réelle (`src/app.js`), sans démarrer de serveur HTTP :

- `POST /api/tasks` : création réussie (201), titre vide (400), date d'échéance manquante (400).
- `GET /api/tasks` : liste triée par urgence, liste vide.
- `PATCH /api/tasks/:id/status` : mise à jour réussie (200), tâche inexistante (404), transition
  interdite (400).
- `GET /api/tasks/overdue-count` : comptage correct.

Chaque test vérifie à la fois le statut HTTP et le format du corps de réponse.

## 8. Test E2E réalisé

Fichier : `e2e/tasks.spec.js`, avec Playwright, sur l'application réelle servie par Express
(le frontend `public/`) :

1. **Parcours nominal** : l'utilisateur ouvre la page, remplit le formulaire (titre, priorité,
   date d'échéance) et clique sur "Ajouter" ; la tâche apparaît dans la liste avec les bonnes
   informations affichées.
2. **Parcours d'erreur** : l'utilisateur soumet un titre vide ; un message d'erreur s'affiche.

Les sélecteurs utilisés sont des `data-testid` (`task-item`, `task-list`) et des rôles
accessibles (`getByRole('button', { name: 'Ajouter' })`), volontairement choisis plutôt que des
sélecteurs CSS fragiles (classes de style, structure DOM), afin de ne pas casser les tests si le
style visuel change.

**Limite technique rencontrée** : l'environnement d'exécution utilisé pendant le développement
(sandbox Claude) bloque le téléchargement du binaire Chromium par Playwright (domaine non
autorisé sur le réseau de la sandbox). Le test a donc été écrit et vérifié syntaxiquement
(`npx playwright test --list` confirme la bonne détection des 2 tests), mais son exécution réelle
avec navigateur doit être faite en local ou via la CI GitHub Actions, qui n'a pas cette
restriction réseau.

## 9. Pipeline CI/CD

- **Emplacement** : `.github/workflows/ci.yml`
- **Déclenchement** : à chaque `push` et `pull request` sur la branche `main`.
- **Jobs** :
  1. `unit-and-integration-tests` : installe les dépendances (`npm ci`), lance `npm run test:unit`
     puis `npm run test:integration`.
  2. `e2e-tests` (dépend du job précédent) : installe les navigateurs Playwright
     (`npx playwright install --with-deps chromium`) puis lance `npm run e2e`.
- **En cas d'échec** : GitHub Actions marque le job en échec et bloque la visibilité verte du
  workflow ; sur une pull request, cela apparaît directement comme un check en échec.
- **Limites actuelles** : le job E2E réinstalle Chromium à chaque exécution (pas de cache), ce
  qui ralentit la pipeline ; il n'y a pas encore de linting automatisé (ESLint) intégré au
  pipeline ; aucune notification externe (Slack, email) n'est configurée en cas d'échec.

## 10. Risques qualité identifiés

- **Concurrence sur le stockage en mémoire** : deux requêtes simultanées pourraient créer une
  incohérence sur `nextId` dans un contexte multi-instances (non testé, risque faible ici car
  Node.js est mono-thread par requête, mais deviendrait réel avec un vrai SGBD partagé).
- **Perte de données au redémarrage** : le stockage en mémoire signifie que toutes les tâches
  sont perdues si le serveur redémarre — acceptable pour ce mini-projet, mais à documenter
  clairement pour ne pas être perçu comme un bug.
- **Validation de date** : le champ `dueDate` n'est pas validé sur son format (une chaîne
  arbitraire non convertible en date pourrait produire un comportement silencieux plutôt qu'une
  erreur explicite). C'est un point d'amélioration identifié plutôt qu'un test manquant caché.
- **Absence d'authentification** : n'importe quel client peut créer ou modifier n'importe quelle
  tâche ; acceptable pour ce mini-projet pédagogique, mais serait un risque de sécurité réel en
  production.


## 11. Limites actuelles

- Pas de suppression ni de modification du titre d'une tâche après création.
- Pas de validation stricte du format de `dueDate`.
- Pas de persistance des données (stockage en mémoire).
- Test E2E non exécuté avec navigateur réel dans l'environnement de développement (voir section 8).
- Pas de linting automatisé dans la CI.

## 12. Améliorations possibles

- Ajouter une validation de format sur `dueDate` (ex. avec une regex ISO 8601 ou une librairie
  de dates) et un test d'erreur associé.
- Ajouter la suppression de tâche et son test unitaire + intégration + E2E.
- Remplacer le stockage en mémoire par une base de données de test dédiée (SQLite en mémoire,
  par exemple), avec reset automatique entre les tests (bonus mentionné dans la consigne).
- Ajouter ESLint à la pipeline CI pour renforcer la qualité globale du code.
- Mesurer la couverture de tests (`vitest --coverage`) pour objectiver le taux de couverture.
