import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../lib/cn';

const defaultGetOptionLabel = (option) => option?.name ?? option?.nom ?? String(option ?? '');
const defaultGetOptionValue = (option) => option?.id ?? option?.value ?? option;
const normalizeText = (value) => String(value ?? '').toLocaleLowerCase('fr-FR');

const SearchableMultiSelect = memo(
  ({
    options = [],
    selected = [],
    onChange,
    placeholder = 'Rechercher...',
    getOptionLabel = defaultGetOptionLabel,
    getOptionValue = defaultGetOptionValue,
    getOptionSearchText,
    emptyMessage = 'No results found',
    ariaLabel = 'Searchable multi select',
    searchLabel = 'Search',
    selectedLabel = 'Selected',
    availableLabel = 'Available',
    loading = false,
    className,
  }) => {
    const searchInputId = useId();
    const listboxId = useId();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const getValue = useCallback((option) => String(getOptionValue(option)), [getOptionValue]);
    const getLabel = useCallback((option) => String(getOptionLabel(option)), [getOptionLabel]);
    const getSearchText = useCallback(
      (option) => String((getOptionSearchText || getOptionLabel)(option)),
      [getOptionLabel, getOptionSearchText]
    );
    const selectedValues = useMemo(
      () =>
        selected.map((value) =>
          typeof value === 'object' && value !== null ? getValue(value) : String(value)
        ),
      [getValue, selected]
    );
    const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

    useEffect(() => {
      const timer = window.setTimeout(() => {
        setDebouncedQuery(query);
      }, 150);

      return () => window.clearTimeout(timer);
    }, [query]);

    const filteredOptions = useMemo(() => {
      const normalizedQuery = normalizeText(debouncedQuery.trim());

      if (!normalizedQuery) {
        return options;
      }

      return options.filter((option) => normalizeText(getSearchText(option)).includes(normalizedQuery));
    }, [debouncedQuery, getSearchText, options]);

    const selectedOptions = useMemo(() => {
      const optionsByValue = new Map(options.map((option) => [getValue(option), option]));

      return selectedValues
        .map((value) => optionsByValue.get(value))
        .filter(Boolean);
    }, [getValue, options, selectedValues]);

    useEffect(() => {
      setActiveIndex((currentIndex) => {
        if (filteredOptions.length === 0) {
          return 0;
        }

        return Math.min(currentIndex, filteredOptions.length - 1);
      });
    }, [filteredOptions.length]);

    const toggleValue = useCallback(
      (value) => {
        if (!onChange) {
          return;
        }

        const nextSelected = selectedSet.has(value)
          ? selectedValues.filter((selectedValue) => selectedValue !== value)
          : [...selectedValues, value];

        onChange(nextSelected);
      },
      [onChange, selectedSet, selectedValues]
    );

    const toggleOption = useCallback(
      (option) => {
        toggleValue(getValue(option));
      },
      [getValue, toggleValue]
    );

    const handleSearchKeyDown = useCallback(
      (event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setIsOpen(true);
          setActiveIndex((currentIndex) =>
            filteredOptions.length > 0 ? Math.min(currentIndex + 1, filteredOptions.length - 1) : 0
          );
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setIsOpen(true);
          setActiveIndex((currentIndex) => (filteredOptions.length > 0 ? Math.max(currentIndex - 1, 0) : 0));
          return;
        }

        if (event.key === 'Enter' && isOpen && filteredOptions[activeIndex]) {
          event.preventDefault();
          toggleOption(filteredOptions[activeIndex]);
        }
      },
      [activeIndex, filteredOptions, isOpen, toggleOption]
    );

    const activeOptionId =
      isOpen && filteredOptions[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined;

    return (
      <div
        className={cn(
          'rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-950',
          className
        )}
        aria-label={ariaLabel}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor={searchInputId} className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              {searchLabel}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id={searchInputId}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder={placeholder}
                aria-label={ariaLabel}
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-expanded={isOpen}
                aria-activedescendant={activeOptionId}
                role="combobox"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pl-9 pr-10 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label={isOpen ? 'Fermer les options' : 'Ouvrir les options'}
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedLabel}</p>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {selectedOptions.length} selectionne(s)
              </span>
            </div>

            {selectedOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedOptions.map((option) => {
                  const value = getValue(option);
                  const label = getLabel(option);

                  return (
                    <span
                      key={value}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                    >
                      <span className="max-w-[14rem] truncate">{label}</span>
                      <button
                        type="button"
                        onClick={() => toggleValue(value)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-blue-500/30"
                        aria-label={`Retirer ${label}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Aucune selection
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{availableLabel}</p>
              {loading ? <span className="text-xs text-slate-500 dark:text-slate-400">Chargement...</span> : null}
            </div>

            {isOpen ? (
              <div
                id={listboxId}
                role="listbox"
                aria-label={availableLabel}
                aria-multiselectable="true"
                className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-950"
              >
                {loading ? (
                  <p className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
                ) : filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => {
                    const value = getValue(option);
                    const label = getLabel(option);
                    const isSelected = selectedSet.has(value);
                    const isActive = index === activeIndex;

                    return (
                      <button
                        key={value}
                        id={`${listboxId}-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => toggleOption(option)}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-700 transition-all duration-200 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none dark:text-slate-200 dark:hover:bg-blue-500/10 dark:focus:bg-blue-500/10',
                          isActive && 'bg-blue-50 dark:bg-blue-500/10',
                          isSelected && 'font-semibold text-blue-700 dark:text-blue-200'
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'inline-flex h-5 w-5 flex-none items-center justify-center rounded-md border transition-all duration-200',
                            isSelected
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-slate-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-900'
                          )}
                        >
                          {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="w-full rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-left text-sm text-slate-500 transition-all duration-200 hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
              >
                Afficher les options
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

SearchableMultiSelect.displayName = 'SearchableMultiSelect';

export default SearchableMultiSelect;
