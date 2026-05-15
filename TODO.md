# TODO - Directeur Dashboard

## Étape 0 — Analyse (fait)
- Vérifier structure existante (DashboardLayout, ProtectedRoute, pages Admin/Prof/Stagiaire, API services).

## Étape 1 — Routing + Protection
- [x] Mettre à jour `frontend/src/App.js` pour ajouter `/dashboard/directeur` protégé par `allowedRoles={['directeur']}`.
- [x] Ajouter les routes enfants pour: dashboard, stagiaires, professeurs, notes, filières, emplois du temps, notifications, profile, settings.




## Étape 2 — Sidebar Directeur
- [ ] Mettre à jour `frontend/src/components/layout/DashboardLayout.jsx` pour ajouter `sidebarConfig.directeur`.


## Étape 3 — Dashboard Directeur
- [ ] Créer `frontend/src/pages/DirecteurDashboard.jsx` (KPI, charts, panel notifications, quick actions).
- [ ] Créer le hook `frontend/src/hooks/useDirecteurDashboardData.js`.

## Étape 4 — Pages Gestion (6)
- [ ] Créer `frontend/src/pages/DirecteurStagiairesPage.jsx` + hook.
- [ ] Créer `frontend/src/pages/DirecteurProfesseursPage.jsx` + hook.
- [ ] Créer `frontend/src/pages/DirecteurNotesPage.jsx` + hook.
- [ ] Créer `frontend/src/pages/DirecteurFilieresPage.jsx` + hook (mock-ready).
- [ ] Créer `frontend/src/pages/DirecteurEmploisDuTempsPage.jsx` + hook (mock-ready).
- [ ] Créer `frontend/src/pages/DirecteurNotificationsPage.jsx` + hook.

## Étape 5 — Hooks/API
- [ ] Utiliser `adminApi.*` là où disponible, sinon mock structuré prêt pour intégration.

## Étape 6 — Vérification
- [ ] Lancer build/start frontend.
- [ ] Vérifier navigation, pages, responsive sidebar, et absence d’erreurs console.


