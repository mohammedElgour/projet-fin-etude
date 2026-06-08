import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Camera,
  CheckCircle2,
  FileUp,
  KeyRound,
  Lock,
  Mail,
  Save,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  Users,
  LoaderCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileApi } from '../services/api';

const editableRoles = new Set(['stagiaire', 'professeur']);

const emptyForm = {
  prenom: '',
  nom: '',
  telephone: '',
  adresse: '',
  email: '',
  current_password: '',
  new_password: '',
  confirm_password: '',
};

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:bg-slate-900';

const cardClass =
  'rounded-2xl border border-gray-200 bg-white shadow-[0_16px_50px_-32px_rgba(15,23,42,0.22)]';

const formatRole = (role = '') => {
  if (role === 'stagiaire') return 'Stagiaire';
  if (role === 'professeur') return 'Professeur';
  if (role === 'admin') return 'Directeur';
  return 'Utilisateur';
};

const getDisplayName = (user) =>
  `${user?.first_name || user?.prenom || ''} ${user?.last_name || user?.nom || ''}`.trim() ||
  user?.name ||
  'Utilisateur';

const getPhotoUrl = (user) => user?.photo_url || user?.avatar || user?.profile_photo_url || '';

const mapUserToForm = (user) => ({
  prenom: user?.prenom || user?.first_name || '',
  nom: user?.nom || user?.last_name || '',
  telephone: user?.telephone || user?.phone || '',
  adresse: user?.adresse || user?.address || '',
  email: user?.email || '',
  current_password: '',
  new_password: '',
  confirm_password: '',
});

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const profileToAccountMeta = (user) => ({
  role: formatRole(user?.role),
  status: user?.is_active === false ? 'Inactif' : 'Actif',
  group: user?.groupe?.nom || user?.group?.nom || user?.group || user?.stagiaire?.groupe?.nom || '-',
  filiere: user?.filiere?.nom || user?.filier?.nom || user?.stagiaire?.filiere?.nom || user?.professeur?.filiere?.nom || '-',
});

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="h-44 animate-pulse rounded-[32px] bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800" />
    <div className="grid gap-6 xl:grid-cols-2">
      {[0, 1, 2, 3].map((block) => (
        <div key={block} className={`${cardClass} p-5`}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-64 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Field = ({ label, error, children, fullWidth = false }) => (
  <div className={fullWidth ? 'sm:col-span-2' : ''}>
    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
    {children}
    {error ? <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p> : null}
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  </div>
);

const SettingsPage = () => {
  const { user, token, login } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const resetTimerRef = useRef(null);
  const isEditable = editableRoles.has(user?.role);

  const [profile, setProfile] = useState(user || null);
  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [basePhotoPreview, setBasePhotoPreview] = useState('');
  const [loading, setLoading] = useState(Boolean(isEditable));
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isEditable) {
      setLoading(false);
      setProfile(user || null);
      setForm(emptyForm);
      setInitialForm(emptyForm);
      setBasePhotoPreview(getPhotoUrl(user || null));
      setPhotoPreview(getPhotoUrl(user || null));
      return undefined;
    }

    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const response = await profileApi.get(user?.role);
        const nextUser = response?.user || user || null;

        if (!active) {
          return;
        }

        const nextForm = mapUserToForm(nextUser);
        const nextPhoto = getPhotoUrl(nextUser);

        setProfile(nextUser);
        setForm(nextForm);
        setInitialForm(nextForm);
        setBasePhotoPreview(nextPhoto);
        setPhotoPreview(nextPhoto);
        setPhotoFile(null);
        setErrors({});
      } catch (error) {
        if (!active) {
          return;
        }

        const message = error?.response?.data?.message || 'Impossible de charger le profil.';
        setLoadError(message);
        toast.error('Chargement impossible.', message);

        const fallbackForm = mapUserToForm(user || null);
        const fallbackPhoto = getPhotoUrl(user || null);
        setProfile(user || null);
        setForm(fallbackForm);
        setInitialForm(fallbackForm);
        setBasePhotoPreview(fallbackPhoto);
        setPhotoPreview(fallbackPhoto);
        setPhotoFile(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [isEditable, toast, user?.role]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(basePhotoPreview);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [basePhotoPreview, photoFile]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const initials = useMemo(() => {
    const source = `${form.prenom || ''} ${form.nom || ''}`.trim() || getDisplayName(profile || user);
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';
  }, [form.nom, form.prenom, profile, user]);

  const accountMeta = useMemo(() => profileToAccountMeta(profile || user), [profile, user]);

  const hasChanges = useMemo(() => {
    return (
      form.prenom.trim() !== initialForm.prenom.trim() ||
      form.nom.trim() !== initialForm.nom.trim() ||
      form.telephone.trim() !== initialForm.telephone.trim() ||
      form.adresse.trim() !== initialForm.adresse.trim() ||
      form.email.trim() !== initialForm.email.trim() ||
      Boolean(photoFile) ||
      Boolean(form.new_password)
    );
  }, [form, initialForm, photoFile]);

  const displayPhoto = photoPreview;
  const displayName = getDisplayName(profile || user);
  const active = profile?.is_active !== false;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSaveState('idle');
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors((current) => ({ ...current, profile_photo: 'Format invalide. Utilisez JPG, PNG ou WEBP.' }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, profile_photo: 'L image ne doit pas depasser 5 Mo.' }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setPhotoFile(file);
    setErrors((current) => ({ ...current, profile_photo: undefined }));
    setSaveState('idle');
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(basePhotoPreview);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrors((current) => ({ ...current, profile_photo: undefined }));
    setSaveState('idle');
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.prenom.trim()) nextErrors.prenom = 'Le prenom est requis.';
    if (!form.nom.trim()) nextErrors.nom = 'Le nom est requis.';
    if (!form.telephone.trim()) nextErrors.telephone = 'Le telephone est requis.';
    if (!form.adresse.trim()) nextErrors.adresse = 'L adresse est requise.';
    if (!form.email.trim()) nextErrors.email = "L adresse email est requise.";

    if (form.new_password) {
      if (!form.current_password) {
        nextErrors.current_password = 'Le mot de passe actuel est requis.';
      }

      if (form.new_password.length < 8) {
        nextErrors.new_password = 'Le nouveau mot de passe doit contenir au moins 8 caracteres.';
      }

      if (!form.confirm_password) {
        nextErrors.confirm_password = 'La confirmation est requise.';
      } else if (form.new_password !== form.confirm_password) {
        nextErrors.confirm_password = 'Les mots de passe ne correspondent pas.';
      }
    }

    return nextErrors;
  };

  const resetSuccessState = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setSaveState('idle');
      resetTimerRef.current = null;
    }, 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isEditable) {
      return;
    }

    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error('Impossible de sauvegarder.', 'Corrigez les champs en erreur.');
      return;
    }

    if (!hasChanges) {
      toast.warning('Aucune modification.', 'Aucune valeur n a change.');
      return;
    }

    setSaving(true);
    setSaveState('idle');

    try {
      const payload = new FormData();
      payload.append('first_name', form.prenom.trim());
      payload.append('last_name', form.nom.trim());
      payload.append('phone', form.telephone.trim());
      payload.append('address', form.adresse.trim());
      payload.append('email', form.email.trim());

      if (form.new_password) {
        payload.append('current_password', form.current_password);
        payload.append('new_password', form.new_password);
        payload.append('new_password_confirmation', form.confirm_password);
      }

      if (photoFile) {
        payload.append('profile_photo', photoFile);
      }

      const response = await profileApi.update(user.role, payload);
      const nextUser = response?.user || profile || user;

      login({ token, user: nextUser });
      setProfile(nextUser);

      const nextForm = mapUserToForm(nextUser);
      setForm(nextForm);
      setInitialForm(nextForm);
      setBasePhotoPreview(getPhotoUrl(nextUser));
      setPhotoPreview(getPhotoUrl(nextUser));
      setPhotoFile(null);
      setErrors({});

      setSaveState('success');
      resetSuccessState();
      toast.success('Profil mis a jour.', response?.message || 'Les modifications ont ete enregistrees.');
    } catch (error) {
      const serverErrors = error?.response?.data?.errors || {};
      const nextErrors = {};

      Object.entries(serverErrors).forEach(([key, messages]) => {
        const normalized =
          key === 'first_name'
            ? 'prenom'
            : key === 'last_name'
              ? 'nom'
              : key === 'phone'
                ? 'telephone'
                : key === 'address'
                  ? 'adresse'
                  : key === 'new_password_confirmation'
                    ? 'confirm_password'
                    : key === 'profile_photo'
                      ? 'profile_photo'
                      : key;

        nextErrors[normalized] = Array.isArray(messages) ? messages[0] : String(messages);
      });

      if (Object.keys(nextErrors).length > 0) {
        setErrors((current) => ({ ...current, ...nextErrors }));
      }

      const message =
        error?.response?.data?.message ||
        Object.values(serverErrors).flat().join(' ') ||
        'Impossible de mettre a jour le profil.';

      toast.error('Echec de la sauvegarde.', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!isEditable) {
    return (
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_24px_80px_-42px_rgba(15,23,42,0.24)]"
        >
          <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-white/25 bg-white/15 text-3xl font-semibold shadow-lg shadow-black/10">
                {displayPhoto ? <img src={displayPhoto} alt="Profile" className="h-full w-full object-cover" /> : initials}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                    {accountMeta.role}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      active ? 'bg-emerald-400/15 text-emerald-50' : 'bg-rose-400/15 text-rose-50'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {active ? 'Compte actif' : 'Compte inactif'}
                  </span>
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{displayName}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                  Les parametres personnels sont disponibles pour les profils professeur et stagiaire.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <div className={`${cardClass} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Session</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Votre compte reste visible ici pour consultation.</p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Le profil detaille et les options de modification sont reserves aux comptes professeur et stagiaire.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_24px_80px_-42px_rgba(15,23,42,0.24)]"
      >
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative group flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-white/25 bg-white/15 text-3xl font-semibold shadow-lg shadow-black/10">
              {displayPhoto ? <img src={displayPhoto} alt="Profile" className="h-full w-full object-cover" /> : <span>{initials}</span>}

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition-opacity duration-200 group-hover:bg-slate-950/35 group-hover:opacity-100">
                <div className="rounded-full bg-white/95 p-2 text-blue-600 shadow-lg">
                  <Camera className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                  {accountMeta.role}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    active ? 'bg-emerald-400/15 text-emerald-50' : 'bg-rose-400/15 text-rose-50'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {active ? 'Compte actif' : 'Compte inactif'}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{displayName}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                Mettez a jour vos coordonnees, votre photo et votre mot de passe depuis un espace clair et securise.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <section className={`${cardClass} p-5`}>
              <SectionHeader icon={UserRound} title="Informations personnelles" subtitle="Prenom, nom, telephone et adresse." />
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Prenom" error={errors.prenom}>
                    <input
                      name="prenom"
                      value={form.prenom}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Sara"
                    />
                  </Field>
                  <Field label="Nom" error={errors.nom}>
                    <input
                      name="nom"
                      value={form.nom}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Bennani"
                    />
                  </Field>
                  <Field label="Telephone" error={errors.telephone}>
                    <input
                      name="telephone"
                      value={form.telephone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="+212 6 12 34 56 78"
                    />
                  </Field>
                  <Field label="Adresse" error={errors.adresse}>
                    <textarea
                      name="adresse"
                      value={form.adresse}
                      onChange={handleChange}
                      rows={4}
                      className={`${inputClass} min-h-[112px] resize-none`}
                      placeholder="Ville, rue, quartier..."
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className={`${cardClass} p-5`}>
              <SectionHeader icon={Camera} title="Photo de profil" subtitle="Importez une image JPG, PNG ou WEBP." />
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-slate-50 text-2xl font-semibold text-slate-700 shadow-inner">
                    {displayPhoto ? (
                      <img src={displayPhoto} alt="Photo de profil" className="h-full w-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition-all duration-200 group-hover:bg-slate-950/35 group-hover:opacity-100">
                      <div className="rounded-full bg-white/95 p-2 text-blue-600 shadow-lg">
                        <Camera className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-blue-200 hover:bg-white hover:text-blue-700">
                      <Upload className="h-4 w-4" />
                      Choisir une image
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </label>

                    <div className="mt-3 text-sm text-slate-500">
                      <p>La photo est associee uniquement a votre compte.</p>
                      {photoFile ? (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            <FileUp className="h-3.5 w-3.5" />
                            {photoFile.name}
                          </span>
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            {formatBytes(photoFile.size)}
                          </span>
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Retirer
                          </button>
                        </div>
                      ) : null}
                      {errors.profile_photo ? (
                        <p className="mt-2 text-xs font-medium text-rose-600">{errors.profile_photo}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className={`${cardClass} p-5`}>
              <SectionHeader icon={KeyRound} title="Compte et securite" subtitle="Email et mot de passe." />
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="space-y-4">
                  <Field label="Email" error={errors.email} fullWidth>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className={`${inputClass} pl-11`}
                        placeholder="vous@ista.ma"
                      />
                    </div>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Mot de passe actuel" error={errors.current_password}>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          name="current_password"
                          type="password"
                          value={form.current_password}
                          onChange={handleChange}
                          className={`${inputClass} pl-11`}
                          placeholder="********"
                        />
                      </div>
                    </Field>

                    <Field label="Nouveau mot de passe" error={errors.new_password}>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          name="new_password"
                          type="password"
                          value={form.new_password}
                          onChange={handleChange}
                          className={`${inputClass} pl-11`}
                          placeholder="Laisser vide pour conserver"
                        />
                      </div>
                    </Field>
                  </div>

                  <Field label="Confirmer le mot de passe" error={errors.confirm_password} fullWidth>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        name="confirm_password"
                        type="password"
                        value={form.confirm_password}
                        onChange={handleChange}
                        className={`${inputClass} pl-11`}
                        placeholder="Confirmer le nouveau mot de passe"
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </section>

            <section className={`${cardClass} p-5`}>
              <SectionHeader icon={ShieldCheck} title="Etat du compte" subtitle="Informations visibles pour votre profil." />
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-600">Statut</span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        active ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700'
                      }`}
                    >
                      {active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Role
                    </div>
                    <p className="text-sm text-slate-600">{accountMeta.role}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Users className="h-4 w-4 text-blue-600" />
                      Groupe
                    </div>
                    <p className="text-sm text-slate-600">{accountMeta.group}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Filiere
                    </div>
                    <p className="text-sm text-slate-600">{accountMeta.filiere}</p>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                    <div className="mt-0.5 rounded-full bg-blue-600/10 p-2 text-blue-700">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Gere par l administration</p>
                      <p className="mt-1 leading-6 text-slate-600">
                        Le role, les groupes et les permissions restent sous controle administratif.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-gray-200 bg-white/90 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl justify-end">
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className={[
                'inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300',
                saveState === 'success'
                  ? 'bg-emerald-500 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-teal-500 hover:opacity-90',
                saving ? 'cursor-not-allowed opacity-80' : '',
                !hasChanges && !saving ? 'cursor-not-allowed opacity-50' : '',
              ].join(' ')}
            >
              {saving ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : saveState === 'success' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Enregistre
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
