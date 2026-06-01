const escapePdfText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildPdf = (lines, title) => {
  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const content = [
    'BT',
    '/F1 18 Tf',
    '50 790 Td',
    `(${escapePdfText(title)}) Tj`,
    '/F1 10 Tf',
    '0 -24 Td',
    ...lines.flatMap((line) => [`(${escapePdfText(line)}) Tj`, '0 -16 Td']),
    'ET',
  ].join('\n');

  const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');
  const pagesId = addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  const pageId = addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  void catalogId;
  void pagesId;
  void pageId;
  void fontId;
  void contentId;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf;
};

const downloadPdf = (filename, title, lines) => {
  const blob = new Blob([buildPdf(lines, title)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const imageToJpegData = async (src) => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    width: canvas.width,
    height: canvas.height,
  };
};

const buildImagePdf = ({ lines, title, imageDataUrl, imageWidth, imageHeight }) => {
  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const imageBinary = atob(imageDataUrl.split(',')[1] || '');
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  const maxImageWidth = pageWidth - margin * 2;
  const maxImageHeight = 560;
  const scale = Math.min(maxImageWidth / imageWidth, maxImageHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const drawX = (pageWidth - drawWidth) / 2;
  const drawY = 72;

  const textCommands = [
    'BT',
    '/F1 18 Tf',
    `${margin} 790 Td`,
    `(${escapePdfText(title)}) Tj`,
    '/F1 10 Tf',
    '0 -22 Td',
    ...lines.flatMap((line) => [`(${escapePdfText(line)}) Tj`, '0 -15 Td']),
    'ET',
  ].join('\n');

  const content = [
    textCommands,
    'q',
    `${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm`,
    '/Im1 Do',
    'Q',
  ].join('\n');

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 6 0 R >> >> /Contents 5 0 R >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  addObject(`<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBinary.length} >>\nstream\n${imageBinary}\nendstream`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let index = 0; index < pdf.length; index += 1) {
    bytes[index] = pdf.charCodeAt(index) & 0xff;
  }

  return bytes;
};

const downloadBinaryPdf = (filename, bytes) => {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadNotesPdf = ({ student, notes, average }) => {
  const generatedAt = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  const lines = [
    'Institut Specialise de Technologie Appliquee',
    `Stagiaire: ${student.name}`,
    `Groupe: ${student.group}`,
    `Filiere: ${student.filiere}`,
    `Annee academique: ${student.academicYear}`,
    `Moyenne generale: ${average}/20`,
    `Genere le: ${generatedAt}`,
    '',
    'Module | C1 | C2 | C3 | EFM | Finale | Statut',
    ...notes.map((note) =>
      [
        note.moduleName,
        note.controle1 ?? '-',
        note.controle2 ?? '-',
        note.controle3 ?? '-',
        note.efm ?? '-',
        note.finalGrade ?? '-',
        note.passed ? 'Valide' : 'Non valide',
      ].join(' | ')
    ),
    '',
    'Document genere automatiquement depuis le portail stagiaire.',
  ];

  downloadPdf('releve-de-notes.pdf', 'Releve de notes', lines);
};

export const downloadSchedulePdf = ({ student, scheduleRows }) => {
  const generatedAt = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  const lines = [
    'Institut Specialise de Technologie Appliquee',
    `Stagiaire: ${student.name}`,
    `Groupe: ${student.group}`,
    `Filiere: ${student.filiere}`,
    `Genere le: ${generatedAt}`,
    '',
    'Jour | Horaire | Module | Salle | Professeur',
    ...scheduleRows.map((slot) =>
      [slot.day, `${slot.startTime} - ${slot.endTime}`, slot.module, slot.room, slot.teacher].join(' | ')
    ),
    '',
    'Document genere automatiquement depuis le portail stagiaire.',
  ];

  downloadPdf('emploi-du-temps.pdf', "Emploi du temps", lines);
};

export const downloadTimetableImagePdf = async ({ student, timetable }) => {
  const generatedAt = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  const image = await imageToJpegData(timetable.image_url);
  const lines = [
    'Institut Specialise de Technologie Appliquee',
    `Groupe: ${student.group}`,
    `Filiere: ${student.filiere}`,
    `Titre: ${timetable.title || 'Emploi du temps'}`,
    `Genere le: ${generatedAt}`,
  ];

  downloadBinaryPdf(
    'emploi-du-temps.pdf',
    buildImagePdf({
      title: "Emploi du temps",
      lines,
      imageDataUrl: image.dataUrl,
      imageWidth: image.width,
      imageHeight: image.height,
    })
  );
};
