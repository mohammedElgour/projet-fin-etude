import React, { useEffect, useMemo, useState } from 'react';
import NotificationsPanel from '../components/common/NotificationsPanel';
import SearchableMultiSelect from '../components/common/SearchableMultiSelect';
import { normalizeCollectionResponse } from '../lib/normalizeCollectionResponse';
import { adminApi } from '../services/api';

const targetOptions = [
  { value: 'all_stagiaires', label: 'Tous les stagiaires' },
  { value: 'all_professeurs', label: 'Tous les professeurs' },
  { value: 'groupes', label: 'Groupes selectionnes' },
  { value: 'stagiaires', label: 'Stagiaires selectionnes' },
  { value: 'professeurs', label: 'Professeurs selectionnes' },
];

const groupLabel = (groupe) => {
  return groupe?.nom || 'Groupe';
};

const studentLabel = (student) => {
  const name = student?.user?.name || 'Stagiaire';
  const groupName = student?.groupe?.nom;

  return groupName ? `${name} - ${groupName}` : name;
};

const professorLabel = (professor) => {
  const name = professor?.user?.name || 'Professeur';

  return professor?.specialite ? `${name} - ${professor.specialite}` : name;
};

const studentSearchText = (student) => student?.user?.name || '';
const professorSearchText = (professor) => professor?.user?.name || '';

const AdminNotificationsPage = () => {
  const [target, setTarget] = useState('all_stagiaires');
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [stagiaires, setStagiaires] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const selectionConfig = useMemo(() => {
    if (target === 'groupes') {
      return {
        ariaLabel: 'Selectionner des groupes',
        availableLabel: 'Available Groups',
        emptyMessage: 'No groups found',
        placeholder: 'Rechercher un groupe...',
        searchLabel: 'Search Groups',
        selectedLabel: 'Selected Groups',
        options: groupes,
        getLabel: groupLabel,
        getSearchText: groupLabel,
      };
    }

    if (target === 'stagiaires') {
      return {
        ariaLabel: 'Selectionner des stagiaires',
        availableLabel: 'Available Students',
        emptyMessage: 'No students found',
        placeholder: 'Rechercher un stagiaire...',
        searchLabel: 'Search Students',
        selectedLabel: 'Selected Students',
        options: stagiaires,
        getLabel: studentLabel,
        getSearchText: studentSearchText,
      };
    }

    if (target === 'professeurs') {
      return {
        ariaLabel: 'Selectionner des professeurs',
        availableLabel: 'Available Professors',
        emptyMessage: 'No professors found',
        placeholder: 'Rechercher un professeur...',
        searchLabel: 'Search Professors',
        selectedLabel: 'Selected Professors',
        options: professeurs,
        getLabel: professorLabel,
        getSearchText: professorSearchText,
      };
    }

    return null;
  }, [groupes, professeurs, stagiaires, target]);

  const selectionErrorField = useMemo(() => {
    if (target === 'groupes') {
      return 'groupe_ids';
    }

    if (target === 'stagiaires') {
      return 'stagiaire_ids';
    }

    if (target === 'professeurs') {
      return 'professeur_ids';
    }

    return 'user_type';
  }, [target]);

  useEffect(() => {
    let mounted = true;

    const loadLookups = async () => {
      const needsGroups = target === 'groupes' && groupes.length === 0;
      const needsStudents = target === 'stagiaires' && stagiaires.length === 0;
      const needsProfessors = target === 'professeurs' && professeurs.length === 0;

      if (!needsGroups && !needsStudents && !needsProfessors) {
        return;
      }

      setLookupLoading(true);
      setError('');

      try {
        if (needsGroups) {
          const response = await adminApi.notificationGroups({ per_page: 200 });

          if (mounted) {
            setGroupes(normalizeCollectionResponse(response));
          }
        }

        if (needsStudents) {
          const response = await adminApi.students({ per_page: 200 });

          if (mounted) {
            setStagiaires(normalizeCollectionResponse(response));
          }
        }

        if (needsProfessors) {
          const response = await adminApi.professors({ per_page: 200 });

          if (mounted) {
            setProfesseurs(normalizeCollectionResponse(response));
          }
        }
      } catch (error) {
        if (mounted) {
          setError(error?.response?.data?.message || 'Impossible de charger les destinataires.');
        }
      } finally {
        if (mounted) {
          setLookupLoading(false);
        }
      }
    };

    loadLookups();

    return () => {
      mounted = false;
    };
  }, [groupes.length, professeurs.length, stagiaires.length, target]);

  const handleTargetChange = (nextTarget) => {
    setTarget(nextTarget);
    setSelectedIds([]);
    setFeedback('');
    setError('');
    setValidationErrors({});
  };

  const buildPayload = () => {
    const basePayload = {
      ...(title.trim() ? { title: title.trim() } : {}),
      message: message.trim(),
    };

    if (target === 'all_stagiaires') {
      return { ...basePayload, target_type: 'user_type', user_type: 'stagiaire' };
    }

    if (target === 'all_professeurs') {
      return { ...basePayload, target_type: 'user_type', user_type: 'professeur' };
    }

    if (target === 'groupes') {
      return { ...basePayload, target_type: 'groupes', groupe_ids: selectedIds.map(Number) };
    }

    if (target === 'stagiaires') {
      return { ...basePayload, target_type: 'stagiaires', stagiaire_ids: selectedIds.map(Number) };
    }

    return { ...basePayload, target_type: 'professeurs', professeur_ids: selectedIds.map(Number) };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');
    setError('');
    setValidationErrors({});

    if (!message.trim()) {
      setError('Saisissez un message.');
      return;
    }

    if (selectionConfig && selectedIds.length === 0) {
      setError('Choisissez au moins un destinataire.');
      return;
    }

    setLoading(true);

    try {
      const payload = buildPayload();
      console.log('Notification payload:', payload);

      const response = await adminApi.sendNotification(payload);
      const count = Number(response?.count ?? 0);

      setFeedback(`${response?.message || 'Notifications sent successfully.'} (${count})`);
      setTitle('');
      setMessage('');
      setSelectedIds([]);
    } catch (error) {
      setError(error?.response?.data?.message || 'Impossible d envoyer les notifications.');
      setValidationErrors(error?.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };

  const renderValidationError = (field) => {
    const messages = validationErrors?.[field];

    if (!messages) {
      return null;
    }

    const normalizedMessages = Array.isArray(messages) ? messages : [messages];

    return (
      <div className="mt-1 space-y-1 text-xs text-rose-600 dark:text-rose-300">
        {normalizedMessages.map((message, index) => (
          <p key={`${field}-${index}`}>{message}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notification globale</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Envoyez une notification a des groupes, profils selectionnes ou types d utilisateurs.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Recipient Type</label>
            <select
              value={target}
              onChange={(event) => handleTargetChange(event.target.value)}
              aria-label="Recipient Type"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition-all duration-200 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {targetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {renderValidationError('target_type')}
            {renderValidationError('user_type')}
          </div>

          {selectionConfig ? (
            <div>
              <SearchableMultiSelect
                options={selectionConfig.options}
                selected={selectedIds}
                onChange={setSelectedIds}
                placeholder={selectionConfig.placeholder}
                getOptionLabel={selectionConfig.getLabel}
                getOptionSearchText={selectionConfig.getSearchText}
                emptyMessage={selectionConfig.emptyMessage}
                ariaLabel={selectionConfig.ariaLabel}
                searchLabel={selectionConfig.searchLabel}
                selectedLabel={selectionConfig.selectedLabel}
                availableLabel={selectionConfig.availableLabel}
                loading={lookupLoading}
              />
              {renderValidationError(selectionErrorField)}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {renderValidationError('title')}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Message</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              required
            />
            {renderValidationError('message')}
          </div>

          {feedback ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{feedback}</p> : null}
          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
          >
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      </section>

      <NotificationsPanel />
    </div>
  );
};

export default AdminNotificationsPage;
