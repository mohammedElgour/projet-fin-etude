const DAY_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const normalizeSlotFromJson = (entry, slot, index) => ({
  id: `${entry.id}-json-${index}`,
  day: slot.jour || entry.day_of_week || 'Non defini',
  startTime: slot.heure_debut || slot.heure || entry.start_time || '--:--',
  endTime: slot.heure_fin || entry.end_time || '',
  module: slot.module || entry.module?.nom || 'Module',
  group: entry.groupe?.nom || '',
  room: slot.salle || entry.room || '',
  date: entry.date || '',
});

const normalizeSlotFromEntry = (entry) => ({
  id: `${entry.id}-direct`,
  day: entry.day_of_week || 'Non defini',
  startTime: entry.start_time || '--:--',
  endTime: entry.end_time || '',
  module: entry.module?.nom || 'Module',
  group: entry.groupe?.nom || '',
  room: entry.room || '',
  date: entry.date || '',
});

export const normalizeTimetableEntries = (entries = []) =>
  entries.flatMap((entry) => {
    if (Array.isArray(entry?.fichier) && entry.fichier.length > 0) {
      return entry.fichier.map((slot, index) => normalizeSlotFromJson(entry, slot, index));
    }

    return [normalizeSlotFromEntry(entry)];
  });

export const groupSlotsByDay = (slots = []) =>
  DAY_ORDER.reduce((accumulator, day) => {
    accumulator[day] = slots.filter((slot) => slot.day === day);
    return accumulator;
  }, {});

export { DAY_ORDER };
