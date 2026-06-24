# TODO

## Backend: fix erreur SQLSTATE[42S02] pivot `professeur_groupe`
- [x] Run migrations to ensure pivot table `professeur_groupe` exists in the active database.
- [ ] Verify table existence in DB (manual check).
- [ ] Test relationship in Tinker: `Professeur::first()->groupes` (pending due to tinker command quoting issues).
- [ ] Hit the endpoint that triggered the query to confirm SQL error is gone.

