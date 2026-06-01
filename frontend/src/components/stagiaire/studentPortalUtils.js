export const PASSING_GRADE = 10;

export const normalizeGradeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const getModuleName = (note) => {
  if (typeof note?.module === 'string') {
    return note.module;
  }

  return note?.module?.nom || note?.module_name || 'Module';
};

export const normalizeStudentNotes = (notes = []) =>
  notes.map((note, index) => {
    const finalGrade = normalizeGradeNumber(note?.note ?? note?.finalGrade);

    return {
      ...note,
      id: note?.id ?? `note-${index}`,
      moduleName: getModuleName(note),
      controle1: normalizeGradeNumber(note?.controle1 ?? note?.cc1),
      controle2: normalizeGradeNumber(note?.controle2 ?? note?.cc2),
      controle3: normalizeGradeNumber(note?.controle3 ?? note?.cc3),
      efm: normalizeGradeNumber(note?.efm),
      finalGrade,
      passed: finalGrade !== null && finalGrade >= PASSING_GRADE,
    };
  });

export const getStudentInfo = (user) => {
  const currentYear = new Date().getFullYear();

  return {
    name: user?.name || 'Stagiaire',
    group: user?.groupe?.nom || user?.groupe || user?.group || 'Groupe non renseigne',
    filiere: user?.filiere?.nom || user?.filier?.nom || user?.filiere || 'Filiere non renseignee',
    academicYear: user?.academic_year || `${currentYear - 1}-${currentYear}`,
  };
};

export const getGradeSummary = (notes = []) => {
  const finalGrades = notes.map((note) => note.finalGrade).filter((grade) => grade !== null);
  const average = finalGrades.length
    ? finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length
    : 0;

  return {
    totalModules: notes.length,
    average: Number(average.toFixed(2)),
    highest: finalGrades.length ? Math.max(...finalGrades) : 0,
    lowest: finalGrades.length ? Math.min(...finalGrades) : 0,
    passed: notes.filter((note) => note.passed).length,
  };
};

const dayAliases = {
  lundi: 'Lundi',
  monday: 'Lundi',
  mardi: 'Mardi',
  tuesday: 'Mardi',
  mercredi: 'Mercredi',
  wednesday: 'Mercredi',
  jeudi: 'Jeudi',
  thursday: 'Jeudi',
  vendredi: 'Vendredi',
  friday: 'Vendredi',
  samedi: 'Samedi',
  saturday: 'Samedi',
};

export const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export const normalizeDay = (value) => {
  const key = String(value || '').trim().toLowerCase();
  return dayAliases[key] || value || 'Jour';
};

export const splitTimeRange = (value) => {
  const raw = String(value || '').trim();
  const [start = '08:30', end = '10:30'] = raw.split(/\s*[-–]\s*/);

  return {
    startTime: start || '08:30',
    endTime: end || '10:30',
    range: raw || `${start} - ${end}`,
  };
};

export const normalizeScheduleRows = (entries = []) =>
  entries.flatMap((entry, entryIndex) => {
    const slots = Array.isArray(entry?.fichier) ? entry.fichier : Array.isArray(entry?.slots) ? entry.slots : [];

    return slots.map((slot, slotIndex) => {
      const times = splitTimeRange(slot?.heure || slot?.time || slot?.horaire);

      return {
        id: `${entry?.id ?? entryIndex}-${slotIndex}`,
        day: normalizeDay(slot?.jour || slot?.day),
        module: slot?.module || slot?.module_name || 'Module',
        teacher: slot?.professeur || slot?.teacher || slot?.prof || 'Professeur a confirmer',
        room: slot?.salle || slot?.room || 'Salle a confirmer',
        ...times,
      };
    });
  });

export const getCurrentDayName = () =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })
    .format(new Date())
    .replace(/^\p{Ll}/u, (letter) => letter.toUpperCase());

export const isTimeInRange = (startTime, endTime) => {
  const now = new Date();
  const [startHour, startMinute] = String(startTime).split(':').map(Number);
  const [endHour, endMinute] = String(endTime).split(':').map(Number);

  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) {
    return false;
  }

  const start = new Date(now);
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(now);
  end.setHours(endHour, endMinute, 0, 0);

  return now >= start && now <= end;
};
