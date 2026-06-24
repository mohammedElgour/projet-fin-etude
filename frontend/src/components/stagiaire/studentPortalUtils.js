export const PASSING_GRADE = 10;

export const WORKFLOW_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const WORKFLOW_STATUS_LABELS = {
  [WORKFLOW_STATUS.DRAFT]: 'Pas encore evalue',
  [WORKFLOW_STATUS.SUBMITTED]: 'En cours',
  [WORKFLOW_STATUS.APPROVED]: 'Valide',
  [WORKFLOW_STATUS.REJECTED]: 'Non valide',
};

export const normalizeGradeNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const normalizeWorkflowStatus = (value) => {
  switch (String(value || '').toLowerCase()) {
    case 'validated':
    case WORKFLOW_STATUS.APPROVED:
      return WORKFLOW_STATUS.APPROVED;
    case 'pending':
    case WORKFLOW_STATUS.SUBMITTED:
      return WORKFLOW_STATUS.SUBMITTED;
    case WORKFLOW_STATUS.REJECTED:
      return WORKFLOW_STATUS.REJECTED;
    case WORKFLOW_STATUS.DRAFT:
      return WORKFLOW_STATUS.DRAFT;
    default:
      return WORKFLOW_STATUS.DRAFT;
  }
};

export const getModuleName = (note) => {
  if (typeof note?.module === 'string') {
    return note.module;
  }

  return note?.module?.nom || note?.module_name || 'Module';
};

const getModuleStatus = (note, finalGrade) => {
  const status = normalizeWorkflowStatus(note?.status ?? note?.validation_status ?? note?.workflowStatus ?? null);

  if (status === WORKFLOW_STATUS.APPROVED) {
    if (finalGrade === null) {
      return WORKFLOW_STATUS.SUBMITTED;
    }

    return finalGrade >= PASSING_GRADE ? WORKFLOW_STATUS.APPROVED : WORKFLOW_STATUS.REJECTED;
  }

  if (status === WORKFLOW_STATUS.REJECTED) {
    return WORKFLOW_STATUS.SUBMITTED;
  }

  return status;
};

const getComponentState = (note, valueField, statusField) => {
  const componentStatus = normalizeWorkflowStatus(
    note?.[statusField] ?? note?.status ?? note?.validation_status ?? note?.workflowStatus ?? null
  );
  const rawValue = normalizeGradeNumber(note?.[valueField]);

  return {
    status: componentStatus,
    value: componentStatus === WORKFLOW_STATUS.APPROVED ? rawValue : null,
  };
};

export const formatGradeLabel = (value, fallback = 'N/A') => {
  const number = normalizeGradeNumber(value);

  if (number === null) {
    return fallback;
  }

  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}/20`;
};

export const normalizeStudentNotes = (notes = []) =>
  notes.map((note, index) => {
    const control1 = getComponentState(note, 'controle1', 'controle1_status');
    const control2 = getComponentState(note, 'controle2', 'controle2_status');
    const control3 = getComponentState(note, 'controle3', 'controle3_status');
    const efm = getComponentState(note, 'efm', 'efm_status');
    const submissionStatus = normalizeWorkflowStatus(
      note?.submission_status ?? note?.submission?.status ?? note?.submission?.workflowStatus ?? null
    );
    const overallStatus = [WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.REJECTED].includes(submissionStatus)
      ? submissionStatus
      : normalizeWorkflowStatus(note?.status ?? note?.validation_status ?? note?.workflowStatus ?? null);
    const finalGrade = overallStatus === WORKFLOW_STATUS.APPROVED ? normalizeGradeNumber(note?.note ?? note?.moyenne ?? note?.finalGrade) : null;
    const moduleStatus = getModuleStatus(note, finalGrade);
    const visibleGrades = [control1.value, control2.value, control3.value, efm.value, finalGrade].filter(
      (grade) => grade !== null
    );

    return {
      ...note,
      id: note?.id ?? `note-${index}`,
      moduleId: note?.module_id ?? note?.module?.id ?? null,
      moduleName: getModuleName(note),
      controle1: control1.value,
      controle1Status: control1.status,
      controle2: control2.value,
      controle2Status: control2.status,
      controle3: control3.value,
      controle3Status: control3.status,
      efm: efm.value,
      efmStatus: efm.status,
      finalGrade,
      overallStatus,
      statusLabel: WORKFLOW_STATUS_LABELS[overallStatus] || WORKFLOW_STATUS_LABELS[WORKFLOW_STATUS.DRAFT],
      moduleStatus,
      moduleStatusLabel: WORKFLOW_STATUS_LABELS[moduleStatus] || WORKFLOW_STATUS_LABELS[WORKFLOW_STATUS.DRAFT],
      passed: finalGrade !== null && finalGrade >= PASSING_GRADE,
      hasVisibleGrades: visibleGrades.length > 0,
      approvedComponentsCount: [control1, control2, control3, efm].filter((component) => component.status === WORKFLOW_STATUS.APPROVED).length,
      hasApprovedFinalGrade: finalGrade !== null,
      isDraft: overallStatus === WORKFLOW_STATUS.DRAFT,
      isSubmitted: overallStatus === WORKFLOW_STATUS.SUBMITTED,
      isApproved: overallStatus === WORKFLOW_STATUS.APPROVED,
      isRejected: overallStatus === WORKFLOW_STATUS.REJECTED,
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
  const approvedGrades = notes.map((note) => note.finalGrade).filter((grade) => grade !== null);
  const average = approvedGrades.length
    ? approvedGrades.reduce((sum, grade) => sum + grade, 0) / approvedGrades.length
    : null;

  return {
    totalModules: notes.length,
    approvedModules: approvedGrades.length,
    pendingModules: Math.max(notes.length - approvedGrades.length, 0),
    average: average === null ? null : Number(average.toFixed(2)),
    highest: approvedGrades.length ? Math.max(...approvedGrades) : null,
    lowest: approvedGrades.length ? Math.min(...approvedGrades) : null,
    passed: approvedGrades.filter((grade) => grade >= PASSING_GRADE).length,
    hasApprovedGrades: approvedGrades.length > 0,
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
  const [start = '08:30', end = '10:30'] = raw.split(/\s*[-â€“]\s*/);

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
