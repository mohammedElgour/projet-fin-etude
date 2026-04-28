import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const CrudModal = ({ isOpen, title, fields = [], initialValues = {}, onClose, onSubmit, submitLabel = 'Enregistrer' }) => {
  const [formValues, setFormValues] = useState(initialValues);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (key, value) => {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formValues);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {field.label}
              </label>

              {field.type === 'select' ? (
                <select
                  value={formValues[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-white"
                  required={field.required}
                >
                  <option value="">Selectionner</option>
                  {(field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formValues[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-white min-h-24"
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={formValues[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-white"
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                />
              )}
            </div>
          ))}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrudModal;
