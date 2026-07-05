# Gestionnaire de tâches

Mini-projet réalisé dans le cadre du module **Qualité logicielle & tests** (MyDigitalSchool Lyon).
Application de gestion de tâches développée selon une démarche TDD, avec une couverture de tests
à trois niveaux (unitaire, intégration, E2E) et une pipeline CI/CD.

## Stack technique

- **Backend** : Node.js + Express
- **Stockage** : en mémoire (voir `QA_REPORT.md` pour la justification)
- **Tests unitaires / intégration** : Vitest + Supertest
- **Test E2E** : Playwright
- **CI/CD** : GitHub Actions
- **Frontend** : HTML / CSS / JavaScript vanilla

## Installation

```bash
npm install
```

## Lancer l'application

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Lancer les tests

```bash
# Tous les tests (unitaires + intégration)
npm test

# Uniquement les tests unitaires
npm run test:unit

# Uniquement les tests d'intégration
npm run test:integration

# Test E2E (nécessite l'installation des navigateurs Playwright)
npx playwright install chromium
npm run e2e
```

## Preuve d'exécution des tests

Dernière exécution de `npm test` (25 tests, 2 fichiers) :

```
✓ tests/integration/taskRoutes.test.js (9 tests) 77ms
✓ tests/unit/taskService.test.js (16 tests) 9ms

 Test Files  2 passed (2)
      Tests  25 passed (25)
```

La pipeline CI/CD (`.github/workflows/ci.yml`) exécute automatiquement ces tests
à chaque push et pull request sur `main`. Voir capture GitHub Actions dans le rapport QA.

## Structure du projet

```
project/
  src/
    domain/
      taskService.js       # Logique métier pure (règles, validations)
      taskRepository.js    # Stockage en mémoire
    routes/
      taskRoutes.js         # Routes API Express
    app.js                  # Configuration de l'application Express
    server.js               # Point d'entrée du serveur
  public/                   # Frontend (HTML/CSS/JS)
  tests/
    unit/                   # Tests unitaires (Vitest)
    integration/            # Tests d'intégration (Supertest)
  e2e/                      # Test E2E (Playwright)
  .github/workflows/ci.yml  # Pipeline CI/CD
  QA_REPORT.md              # Rapport qualité complet
```

## Règles métier principales

1. Une tâche sans titre est invalide.
2. La priorité doit appartenir à `basse`, `moyenne` ou `haute`.
3. Une tâche est "en retard" si sa date d'échéance est passée et qu'elle n'est pas terminée.
4. Une tâche terminée ne peut pas repasser directement à "à faire" (doit passer par "en cours").
5. Les tâches en retard et de priorité haute sont affichées en tête de liste.

Pour le détail complet de la stratégie qualité, voir [QA_REPORT.md](./QA_REPORT.md).
