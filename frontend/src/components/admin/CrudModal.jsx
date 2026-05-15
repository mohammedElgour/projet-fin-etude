import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Eye, Plus, Save, Search, X } from 'lucide-react';
import ActionButton from './ActionButton';
import { cn } from '../../lib/cn';

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panel = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: 18, scale: 0.98, transition: { duration: 0.15 } },
};

const buildTouchedState = (fieldList = []) =>
  fieldList.reduce((accumulator, field) => {
    accumulator[field.name] = false;
    return accumulator;
  }, {});

const ensureObject = (value) => (value && typeof value === 'object' ? value : {});

const CrudModal = ({
  isOpen,
  mode = 'create',
  title,
  fields = [],
  detailFields = [],
  initialValues = {},
  onClose,
  onSubmit,
  submitLabel = 'Enregistrer',
  loading = false,
  validate,
}) => {
  const safeInitialValues = useMemo(() => ensureObject(initialValues), [initialValues]);
  const safeFields = useMemo(() => (Array.isArray(fields) ? fields : []), [fields]);
  const safeDetailFields = useMemo(() => (Array.isArray(detailFields) ? detailFields : []), [detailFields]);

  const [formValues, setFormValues] = useState(() => safeInitialValues);
  const [touched, setTouched] = useState(() => buildTouchedState(safeFields));
  const [activeSearchableField, setActiveSearchableField] = useState(null);
  const [searchQueries, setSearchQueries] = useState({});
  const isView = mode === 'view';

  useEffect(() => {
    setFormValues(safeInitialValues);
    setTouched(buildTouchedState(safeFields));
    setActiveSearchableField(null);
    setSearchQueries({});
  }, [isOpen, safeInitialValues, safeFields]);

  const visibleFields = useMemo(
    () =>
      (isView ? safeDetailFields : safeFields).filter((field) =>
        typeof field?.visible === 'function' ? field.visible(formValues, mode) !== false : field?.visible !== false
      ),
    [safeDetailFields, safeFields, formValues, isView, mode]
  );

  const formErrors = useMemo(() => {
    if (!validate || isView) {
      return {};
    }

    return ensureObject(validate(formValues, mode));
  }, [formValues, isView, mode, validate]);

  useEffect(() => {
    if (!activeSearchableField) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const container = document.querySelector(`[data-searchable-field="${activeSearchableField}"]`);
      if (container && !container.contains(event.target)) {
        setActiveSearchableField(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [activeSearchableField]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (key, value) => {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
    setTouched((current) => ({
      ...current,
      [key]: true,
    }));
  };

  const handleBlur = (key) => {
    setTouched((current) => ({
      ...current,
      [key]: true,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isView) {
      const allTouched = buildTouchedState(visibleFields);
      Object.keys(allTouched).forEach((key) => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      if (Object.keys(formErrors ?? {}).length > 0) {
        return;
      }

      onSubmit(formValues);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={backdrop}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      >
        <motion.div
          variants={panel}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-white/60 bg-white/95 shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-950/95"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isView
                  ? "Consultez les informations detaillees de cette fiche."
                  : "Renseignez les informations necessaires puis confirmez l'action."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-6 md:grid-cols-2">
              {visibleFields.map((field) => (
                <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
                  {(() => {
                    const required = typeof field.required === 'function' ? field.required(formValues, mode) : field.required;
                    const disabled = typeof field.disabled === 'function' ? field.disabled(formValues, mode) : field.disabled;
                    const placeholder = typeof field.placeholder === 'function' ? field.placeholder(formValues, mode) : field.placeholder;
                    const options = (typeof field.options === 'function' ? field.options(formValues, mode) : field.options) || [];
                    const searchableOptions = options.filter((option) =>
                      String(option.label ?? '')
                        .toLowerCase()
                        .includes((searchQueries[field.name] || '').toLowerCase())
                    );
                    const selectedOption = options.find((option) => String(option.value) === String(formValues[field.name] ?? ''));
                    const showError = !isView && touched[field.name] && formErrors[field.name];
                    const baseInputClassName =
                      'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition dark:bg-slate-950 dark:text-white';
                    const inputStateClassName = showError
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 dark:border-rose-500 dark:focus:border-rose-400 dark:focus:ring-rose-500/15'
                      : 'border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:focus:border-blue-500 dark:focus:ring-blue-500/15';

                    return (
                      <>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {field.label}
                  </label>

                  {isView ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-white/50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
                      {field.renderValue ? field.renderValue(safeInitialValues?.[field.name], safeInitialValues) : safeInitialValues?.[field.name] || '-'}
                    </div>
                  ) : field.type === 'select' ? (
                    <select
                      value={formValues[field.name] ?? ''}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      onBlur={() => handleBlur(field.name)}
                      className={`${baseInputClassName} ${inputStateClassName}`}
                      required={required}
                      disabled={disabled}
                    >
                      <option value="">{placeholder || 'Selectionner'}</option>
                      {options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formValues[field.name] ?? ''}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      onBlur={() => handleBlur(field.name)}
                      className={`min-h-28 ${baseInputClassName} ${inputStateClassName}`}
                      required={required}
                      placeholder={placeholder}
                      disabled={disabled}
                    />
                  ) : field.type === 'searchable-select' ? (
                    <div className="relative" data-searchable-field={field.name}>
                      <button
                        type="button"
                        onClick={() => {
                          if (disabled) {
                            return;
                          }

                          handleBlur(field.name);
                          setActiveSearchableField((current) => (current === field.name ? null : field.name));
                        }}
                        className={cn(
                          `${baseInputClassName} ${inputStateClassName} items-center justify-between text-left`,
                          'flex',
                          disabled && 'cursor-not-allowed opacity-60'
                        )}
                        disabled={disabled}
                      >
                        <span className={selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                          {selectedOption?.label || placeholder || 'Selectionner'}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </button>

                      {activeSearchableField === field.name ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-950">
                          <div className="border-b border-slate-200/80 p-3 dark:border-slate-800">
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                value={searchQueries[field.name] || ''}
                                onChange={(event) =>
                                  setSearchQueries((current) => ({
                                    ...current,
                                    [field.name]: event.target.value,
                                  }))
                                }
                                placeholder="Rechercher..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
                              />
                            </div>
                          </div>

                          <div className="max-h-56 overflow-y-auto p-2">
                            {searchableOptions.length > 0 ? (
                              searchableOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    handleChange(field.name, option.value);
                                    handleBlur(field.name);
                                    setActiveSearchableField(null);
                                    setSearchQueries((current) => ({
                                      ...current,
                                      [field.name]: '',
                                    }));
                                  }}
                                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
                                >
                                  <span>{option.label}</span>
                                  {String(option.value) === String(formValues[field.name] ?? '') ? (
                                    <Check className="h-4 w-4 text-blue-500" />
                                  ) : null}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                Aucune option trouvee.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formValues[field.name] ?? ''}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      onBlur={() => handleBlur(field.name)}
                      className={`${baseInputClassName} ${inputStateClassName}`}
                      required={required}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      placeholder={placeholder}
                      disabled={disabled}
                    />
                  )}

                  {!isView && showError ? (
                    <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{formErrors[field.name]}</p>
                  ) : null}
                  {!isView && field.hint ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{field.hint}</p>
                  ) : null}
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 px-6 py-5 dark:border-slate-800 sm:flex-row sm:justify-end">
              <ActionButton variant="neutral" onClick={onClose} disabled={loading}>
                Annuler
              </ActionButton>

              {isView ? (
                <ActionButton variant="secondary" icon={Eye} onClick={onClose}>
                  Fermer
                </ActionButton>
              ) : (
                <ActionButton
                  type="submit"
                  variant={mode === 'create' ? 'primary' : 'success'}
                  icon={mode === 'create' ? Plus : Save}
                  loading={loading}
                  disabled={loading}
                >
                  {submitLabel}
                </ActionButton>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CrudModal;
