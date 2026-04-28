# Management Sections Implementation TODO

## Backend (3 steps)
- [ ] 1. Create `backend/app/Http/Controllers/Api/Admin/GroupeController.php` with CRUD methods
- [ ] 2. Add API routes for all 5 sections in `backend/routes/api.php` 
- [ ] 3. Verify controllers have proper CRUD (Stagiaire/Professeur/Module/Filiere exist)

## Frontend Reusable Components (2 steps)
- [ ] 4. Create `frontend/src/components/admin/ManagementTable.jsx` (generic table w/ search, zebra/hover)
- [ ] 5. Create `frontend/src/components/admin/CrudModal.jsx` (generic add/edit form modal)

## Frontend Management Pages (5 steps)
- [ ] 6. Create `frontend/src/pages/admin/StagiairesManagement.jsx`
- [ ] 7. Create `frontend/src/pages/admin/ProfesseursManagement.jsx`
- [ ] 8. Create `frontend/src/pages/admin/GroupesManagement.jsx`
- [ ] 9. Create `frontend/src/pages/admin/ModulesManagement.jsx`
- [ ] 10. Create `frontend/src/pages/admin/FilieresManagement.jsx`

## Integration (4 steps)
- [ ] 11. Update `frontend/src/services/api.js` - add CRUD methods to adminApi
- [ ] 12. Add 5 routes to `frontend/src/App.js`
- [ ] 13. Add 5 nav buttons to `frontend/src/pages/AdminDashboard.jsx` Quick Actions
- [ ] 14. Test all CRUD operations, styling, empty states

**Current Progress: Starting Step 1**
