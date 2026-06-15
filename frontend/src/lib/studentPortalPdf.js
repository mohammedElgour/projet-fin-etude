const escapePdfText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

const COLORS = {
  navy: [15, 23, 42],
  navySoft: [30, 41, 59],
  sky: [14, 165, 233],
  skySoft: [224, 242, 254],
  emerald: [16, 185, 129],
  emeraldSoft: [209, 250, 229],
  amber: [245, 158, 11],
  amberSoft: [254, 243, 199],
  rose: [244, 63, 94],
  roseSoft: [255, 228, 230],
  slate: [100, 116, 139],
  slateSoft: [241, 245, 249],
  border: [226, 232, 240],
  borderDark: [51, 65, 85],
  ink: [15, 23, 42],
  muted: [71, 85, 105],
  white: [255, 255, 255],
};

const rgb = (color) => color.map((component) => (component / 255).toFixed(3)).join(' ');

const estimateTextWidth = (text, size = 10) => String(text ?? '').length * size * 0.52;

const truncateText = (text, maxWidth, size = 10) => {
  const value = String(text ?? '');
  if (!value) {
    return '';
  }

  if (estimateTextWidth(value, size) <= maxWidth) {
    return value;
  }

  const maxChars = Math.max(4, Math.floor(maxWidth / (size * 0.52)));
  return `${value.slice(0, Math.max(1, maxChars - 3)).trim()}...`;
};

const chunkArray = (items, size) => {
  if (!items.length) {
    return [];
  }

  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const addText = (page, text, x, yTop, options = {}) => {
  const {
    font = 'F1',
    size = 10,
    color = COLORS.ink,
    align = 'left',
    maxWidth = null,
  } = options;

  const value = maxWidth ? truncateText(text, maxWidth, size) : String(text ?? '');
  const textWidth = estimateTextWidth(value, size);
  const drawX =
    align === 'center'
      ? x - textWidth / 2
      : align === 'right'
        ? x - textWidth
        : x;
  const drawY = PAGE_HEIGHT - yTop - size;

  page.push(
    'BT',
    `/${font} ${size} Tf`,
    `${rgb(color)} rg`,
    `1 0 0 1 ${drawX.toFixed(2)} ${drawY.toFixed(2)} Tm`,
    `(${escapePdfText(value)}) Tj`,
    'ET'
  );
};

const addRect = (page, x, yTop, w, h, options = {}) => {
  const { fill = null, stroke = null, lineWidth = 1 } = options;
  const y = PAGE_HEIGHT - yTop - h;

  page.push('q');
  if (fill) {
    page.push(`${rgb(fill)} rg`);
  }
  if (stroke) {
    page.push(`${rgb(stroke)} RG`, `${lineWidth} w`);
  }
  page.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);

  if (fill && stroke) {
    page.push('B');
  } else if (fill) {
    page.push('f');
  } else if (stroke) {
    page.push('S');
  }
  page.push('Q');
};

const addLine = (page, x1, y1Top, x2, y2Top, options = {}) => {
  const { stroke = COLORS.border, lineWidth = 1 } = options;
  const y1 = PAGE_HEIGHT - y1Top;
  const y2 = PAGE_HEIGHT - y2Top;

  page.push(
    'q',
    `${rgb(stroke)} RG`,
    `${lineWidth} w`,
    `${x1.toFixed(2)} ${y1.toFixed(2)} m`,
    `${x2.toFixed(2)} ${y2.toFixed(2)} l`,
    'S',
    'Q'
  );
};

const addBadge = (page, x, yTop, w, h, text, options = {}) => {
  const {
    fill = COLORS.skySoft,
    textColor = COLORS.ink,
    stroke = null,
    font = 'F2',
    size = 9,
  } = options;

  addRect(page, x, yTop, w, h, { fill, stroke, lineWidth: 1 });
  addText(page, text, x + w / 2, yTop + (h / 2) + 2, {
    font,
    size,
    color: textColor,
    align: 'center',
    maxWidth: w - 8,
  });
};

const drawMonogram = (page, x, yTop, size) => {
  addRect(page, x, yTop, size, size, {
    fill: COLORS.navy,
    stroke: COLORS.sky,
    lineWidth: 1.4,
  });

  addRect(page, x + 4, yTop + 4, size - 8, 6, {
    fill: COLORS.sky,
  });

  addText(page, 'ISTA', x + size / 2, yTop + 31, {
    font: 'F2',
    size: 16,
    color: COLORS.white,
    align: 'center',
  });

  addText(page, 'Notes', x + size / 2, yTop + 49, {
    font: 'F1',
    size: 8,
    color: [191, 219, 254],
    align: 'center',
  });
};

const drawCard = (page, x, yTop, w, h, options = {}) => {
  const {
    fill = COLORS.white,
    stroke = COLORS.border,
    lineWidth = 1,
  } = options;

  addRect(page, x, yTop, w, h, { fill, stroke, lineWidth });
};

const drawSectionTitle = (page, x, yTop, title, subtitle = '') => {
  addText(page, title, x, yTop, {
    font: 'F2',
    size: 13,
    color: COLORS.ink,
  });

  if (subtitle) {
    addText(page, subtitle, x, yTop + 15, {
      font: 'F1',
      size: 8.5,
      color: COLORS.muted,
    });
  }
};

const buildTranscriptPageData = ({
  student,
  notes,
  average,
  validatedModulesCount,
  totalModulesCount,
  nonValidatedModulesCount,
  mention,
  generatedAt,
}) => {
  const normalizedStudent = {
    id: student?.id || '',
    code: student?.code || (student?.id ? `STG-${student.id}` : 'STG-0000'),
    name: student?.name || 'Stagiaire',
    group: student?.group || '-',
    filiere: student?.filiere || '-',
    academicYear: student?.academicYear || '2025-2026',
    email: student?.email || 'contact@istanotes.ma',
    phone: student?.phone || '-',
    address: student?.address || 'Etablissement ISTA / OFPPT, Maroc',
  };

  const rows = notes.map((note) => ({
    module: note?.moduleName || note?.module || 'Module',
    controle1: note?.controle1 ?? note?.cc1 ?? null,
    controle2: note?.controle2 ?? note?.cc2 ?? null,
    controle3: note?.controle3 ?? note?.cc3 ?? null,
    efm: note?.efm ?? null,
    finalGrade: note?.finalGrade ?? note?.note ?? null,
    passed: Boolean(note?.passed ?? ((Number(note?.note ?? note?.finalGrade) || 0) >= 10)),
  }));

  return {
    student: normalizedStudent,
    rows,
    average: Number.isFinite(Number(average)) ? Number(average) : 0,
    validatedModulesCount: Number(validatedModulesCount ?? rows.length),
    totalModulesCount: Number(totalModulesCount ?? rows.length),
    nonValidatedModulesCount: Number(nonValidatedModulesCount ?? 0),
    mention: mention || 'Passable',
    generatedAt: generatedAt || new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date()),
  };
};

const buildTranscriptPages = (payload) => {
  const data = buildTranscriptPageData(payload);
  const rowHeight = 22;
  const firstPageCapacity = 14;
  const continuationCapacity = 28;
  const firstPageRows = data.rows.slice(0, firstPageCapacity);
  const remainingRows = data.rows.slice(firstPageCapacity);
  const continuationChunks = chunkArray(remainingRows, continuationCapacity);
  const pageRows = [firstPageRows, ...continuationChunks];

  const pages = pageRows.length ? pageRows : [[]];
  const contentPages = [];

  pages.forEach((rows, index) => {
    const page = [];
    const firstPage = index === 0;
    const topBandHeight = firstPage ? 132 : 48;
    const tableTop = firstPage ? 372 : 96;
    const rowStart = firstPage ? 396 : 120;

    if (firstPage) {
      addRect(page, 0, 0, PAGE_WIDTH, topBandHeight, {
        fill: COLORS.navy,
        stroke: COLORS.navy,
      });
      addRect(page, 0, 0, PAGE_WIDTH, 8, {
        fill: COLORS.sky,
        stroke: COLORS.sky,
      });

      drawMonogram(page, 34, 26, 78);

      addText(page, 'Institut Specialise de Technologie Appliquee', 128, 30, {
        font: 'F2',
        size: 18,
        color: COLORS.white,
      });
      addText(page, 'Releve de notes officiel', 128, 52, {
        font: 'F1',
        size: 10.5,
        color: [226, 232, 240],
      });
      addText(page, 'Adresse: Etablissement ISTA / OFPPT, Maroc', 128, 68, {
        font: 'F1',
        size: 8.8,
        color: [199, 210, 254],
      });
      addText(page, 'Contact: contact@istanotes.ma', 128, 82, {
        font: 'F1',
        size: 8.8,
        color: [199, 210, 254],
      });

      drawCard(page, 392, 24, 169, 86, {
        fill: COLORS.white,
        stroke: [191, 219, 254],
        lineWidth: 1,
      });
      addBadge(page, 406, 38, 92, 18, 'OFFICIAL DOC', {
        fill: COLORS.skySoft,
        textColor: COLORS.sky,
        stroke: [186, 230, 253],
        font: 'F2',
        size: 8.5,
      });
      addText(page, 'Releve de notes', 406, 64, {
        font: 'F2',
        size: 14,
        color: COLORS.navy,
      });
      addText(page, data.generatedAt, 406, 82, {
        font: 'F1',
        size: 8.5,
        color: COLORS.muted,
      });
      addText(page, `Statut: ${data.validatedModulesCount === data.totalModulesCount ? 'Pret' : 'Verifie'}`, 406, 96, {
        font: 'F1',
        size: 8.5,
        color: COLORS.muted,
      });

      drawCard(page, 34, 150, 527, 104, {
        fill: COLORS.white,
        stroke: COLORS.border,
      });
      drawSectionTitle(page, 52, 170, 'Informations etudiant', 'Identite academique et resume du dossier.');

      const leftX = 52;
      const rightX = 300;
      addText(page, 'Nom complet', leftX, 194, {
        font: 'F1',
        size: 8,
        color: COLORS.muted,
      });
      addText(page, data.student.name, leftX, 208, {
        font: 'F2',
        size: 11,
        color: COLORS.ink,
        maxWidth: 210,
      });
      addText(page, 'Code etudiant', leftX, 228, {
        font: 'F1',
        size: 8,
        color: COLORS.muted,
      });
      addText(page, data.student.code, leftX, 242, {
        font: 'F2',
        size: 11,
        color: COLORS.ink,
        maxWidth: 210,
      });
      addText(page, 'Groupe', leftX, 262, {
        font: 'F1',
        size: 8,
        color: COLORS.muted,
      });
      addText(page, data.student.group, leftX, 276, {
        font: 'F2',
        size: 11,
        color: COLORS.ink,
        maxWidth: 210,
      });

      addText(page, 'Filiere', rightX, 194, {
        font: 'F1',
        size: 8,
        color: COLORS.muted,
      });
      addText(page, data.student.filiere, rightX, 208, {
        font: 'F2',
        size: 11,
        color: COLORS.ink,
        maxWidth: 210,
      });
      addText(page, 'Annee academique', rightX, 228, {
        font: 'F1',
        size: 8,
        color: COLORS.muted,
      });
      addText(page, data.student.academicYear, rightX, 242, {
        font: 'F2',
        size: 11,
        color: COLORS.ink,
        maxWidth: 210,
      });
      addText(page, 'Contact', rightX, 262, {
        font: 'F1',
        size: 8,
        color: COLORS.muted,
      });
      addText(page, data.student.email, rightX, 276, {
        font: 'F2',
        size: 11,
        color: COLORS.ink,
        maxWidth: 210,
      });

      const cardY = 274;
      const cardW = 122.25;
      const gap = 10;
      const cardX = [34, 34 + cardW + gap, 34 + (cardW + gap) * 2, 34 + (cardW + gap) * 3];
      const statCards = [
        {
          label: 'Moyenne generale',
          value: `${data.average.toFixed(2)}/20`,
          subtitle: 'Calcul sur les modules validates',
          fill: COLORS.skySoft,
          text: COLORS.navy,
        },
        {
          label: 'Modules valides',
          value: `${data.validatedModulesCount}`,
          subtitle: 'Validation complete',
          fill: COLORS.emeraldSoft,
          text: COLORS.navy,
        },
        {
          label: 'Modules non valides',
          value: `${data.nonValidatedModulesCount}`,
          subtitle: 'Aucune evaluation finale',
          fill: COLORS.amberSoft,
          text: COLORS.navy,
        },
        {
          label: 'Mention',
          value: data.mention,
          subtitle: 'Resultat academique',
          fill: COLORS.roseSoft,
          text: COLORS.navy,
        },
      ];

      statCards.forEach((card, cardIndex) => {
        const x = cardX[cardIndex];
        drawCard(page, x, cardY, cardW, 72, {
          fill: card.fill,
          stroke: [255, 255, 255],
        });
        addText(page, card.label, x + 12, cardY + 18, {
          font: 'F1',
          size: 7.8,
          color: COLORS.muted,
        });
        addText(page, card.value, x + 12, cardY + 38, {
          font: 'F2',
          size: 14,
          color: card.text,
          maxWidth: cardW - 24,
        });
        addText(page, card.subtitle, x + 12, cardY + 56, {
          font: 'F1',
          size: 7.5,
          color: COLORS.muted,
          maxWidth: cardW - 24,
        });
      });
    } else {
      addRect(page, 0, 0, PAGE_WIDTH, topBandHeight, {
        fill: COLORS.navy,
        stroke: COLORS.navy,
      });
      addRect(page, 0, 0, PAGE_WIDTH, 6, {
        fill: COLORS.sky,
        stroke: COLORS.sky,
      });
      addText(page, 'Releve de notes - continuation', 34, 18, {
        font: 'F2',
        size: 14,
        color: COLORS.white,
      });
      addText(page, `${data.student.name} - ${data.student.code}`, 34, 34, {
        font: 'F1',
        size: 8.5,
        color: [199, 210, 254],
      });
    }

    const tableColumns = [
      { label: 'Module', width: 150, align: 'left' },
      { label: 'Controle 1', width: 56, align: 'center' },
      { label: 'Controle 2', width: 56, align: 'center' },
      { label: 'Controle 3', width: 56, align: 'center' },
      { label: 'EFM', width: 56, align: 'center' },
      { label: 'Note Finale', width: 72, align: 'center' },
      { label: 'Statut', width: 81, align: 'center' },
    ];

    const tableX = 34;
    const tableWidth = 527;
    const tableHeaderHeight = 24;
    const headerBg = firstPage ? COLORS.slateSoft : [248, 250, 252];

    drawSectionTitle(
      page,
      34,
      firstPage ? 352 : 78,
      'Tableau des modules',
      'Chaque ligne resume les controles, la note finale et le statut.'
    );

    drawCard(page, tableX, tableTop, tableWidth, tableHeaderHeight + rows.length * rowHeight, {
      fill: COLORS.white,
      stroke: COLORS.border,
    });

    let currentX = tableX;
    tableColumns.forEach((column, columnIndex) => {
      const background = columnIndex === 0 ? headerBg : headerBg;
      addRect(page, currentX, tableTop, column.width, tableHeaderHeight, {
        fill: background,
        stroke: COLORS.border,
      });
      const headerX = column.align === 'center' ? currentX + column.width / 2 : currentX + 8;
      addText(page, column.label, headerX, tableTop + 15, {
        font: 'F2',
        size: 8.1,
        color: COLORS.navy,
        align: column.align === 'center' ? 'center' : 'left',
        maxWidth: column.width - 12,
      });
      currentX += column.width;
    });

    rows.forEach((row, rowIndex) => {
      const rowTop = rowStart + rowIndex * rowHeight;
      const zebra = rowIndex % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
      const badgeColor = row.passed ? COLORS.emeraldSoft : COLORS.roseSoft;
      const badgeText = row.passed ? COLORS.emerald : COLORS.rose;
      currentX = tableX;

      tableColumns.forEach((column, columnIndex) => {
        addRect(page, currentX, rowTop, column.width, rowHeight, {
          fill: zebra,
          stroke: COLORS.border,
        });

        if (columnIndex === 0) {
          addText(page, row.module, currentX + 8, rowTop + 14, {
            font: 'F2',
            size: 9,
            color: COLORS.ink,
            maxWidth: column.width - 16,
          });
        } else if (column.label === 'Statut') {
          addBadge(page, currentX + 8, rowTop + 3, column.width - 16, 16, row.passed ? 'Valide' : 'Non valide', {
            fill: badgeColor,
            textColor: badgeText,
            stroke: null,
            font: 'F2',
            size: 7.5,
          });
        } else {
          const value =
            row[column.label === 'Note Finale'
              ? 'finalGrade'
              : column.label === 'Controle 1'
                ? 'controle1'
                : column.label === 'Controle 2'
                  ? 'controle2'
                  : column.label === 'Controle 3'
                    ? 'controle3'
                    : 'efm'];

          addText(page, value === null || value === undefined ? '-' : Number(value).toFixed(2).replace(/\.00$/, ''), currentX + column.width / 2, rowTop + 14, {
            font: 'F1',
            size: 8.6,
            color: COLORS.ink,
            align: 'center',
            maxWidth: column.width - 8,
          });
        }

        currentX += column.width;
      });
    });

    if (firstPage) {
      const footerTop = 734;
      addText(page, `Date de generation: ${data.generatedAt}`, 34, footerTop, {
        font: 'F1',
        size: 8.4,
        color: COLORS.muted,
      });
      addText(page, 'Document officiel a imprimer avec signature et cachet.', 34, footerTop + 14, {
        font: 'F1',
        size: 8,
        color: COLORS.muted,
      });

      drawCard(page, 34, 742, 240, 60, {
        fill: [252, 253, 255],
        stroke: COLORS.border,
      });
      addText(page, 'Signature autorisee', 48, 758, {
        font: 'F2',
        size: 9,
        color: COLORS.ink,
      });
      addLine(page, 48, 792, 252, 792, {
        stroke: COLORS.borderDark,
        lineWidth: 1,
      });
      addText(page, 'Nom et qualite', 48, 812, {
        font: 'F1',
        size: 7.8,
        color: COLORS.muted,
      });

      drawCard(page, 321, 742, 240, 60, {
        fill: [252, 253, 255],
        stroke: COLORS.border,
      });
      addText(page, 'Cachet de l etablissement', 335, 758, {
        font: 'F2',
        size: 9,
        color: COLORS.ink,
      });
      addRect(page, 418, 772, 48, 22, {
        fill: [239, 246, 255],
        stroke: [191, 219, 254],
      });
      addText(page, 'STA MP', 442, 787, {
        font: 'F2',
        size: 8.2,
        color: COLORS.sky,
        align: 'center',
      });
      addText(page, 'Zone reservee au cachet officiel', 335, 812, {
        font: 'F1',
        size: 7.8,
        color: COLORS.muted,
      });
    }

    addText(page, `Page ${index + 1} / ${pages.length}`, 561, 816, {
      font: 'F1',
      size: 7.8,
      color: firstPage ? [226, 232, 240] : [199, 210, 254],
      align: 'right',
    });

    contentPages.push(page);
  });

  return contentPages;
};

const buildTranscriptPdf = (payload) => {
  const pages = buildTranscriptPages(payload);
  const objects = [
    null,
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-BoldOblique >>',
  ];

  const pageIds = [];

  pages.forEach((pageOps) => {
    const content = pageOps.join('\n');
    const contentId = objects.length + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

    const pageId = objects.length + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

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

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

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
    const candidates = [src];

    try {
      const url = new URL(src, window.location.href);
      if (url.hostname === '127.0.0.1') {
        const localhostUrl = new URL(url.toString());
        localhostUrl.hostname = 'localhost';
        candidates.push(localhostUrl.toString());
      } else if (url.hostname === 'localhost') {
        const loopbackUrl = new URL(url.toString());
        loopbackUrl.hostname = '127.0.0.1';
        candidates.push(loopbackUrl.toString());
      }
    } catch (error) {
      console.debug('[pdf] image URL normalization skipped', { src, error });
    }

    const tryLoad = (index) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => {
        if (index + 1 < candidates.length) {
          tryLoad(index + 1);
          return;
        }

        reject(
          new Error(
            `Impossible de charger l'image du planning. URLs testees: ${candidates.join(' -> ')}`
          )
        );
      };
      image.src = candidates[index];
    };

    tryLoad(0);
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

export const downloadNotesPdf = (payload = {}) => {
  const notes = Array.isArray(payload.notes) ? payload.notes : [];
  const validatedModulesCount = Number(
    payload.validated_modules_count ?? payload.validatedModulesCount ?? notes.filter((note) => note?.passed).length
  );
  const totalModulesCount = Number(payload.total_modules_count ?? payload.totalModulesCount ?? notes.length);

  if (!totalModulesCount || validatedModulesCount !== totalModulesCount) {
    return false;
  }

  const average = Number(payload.average ?? 0);
  const mention = payload.mention || (average >= 16 ? 'Excellent' : average >= 14 ? 'Tres Bien' : average >= 12 ? 'Bien' : average >= 10 ? 'Assez Bien' : 'Passable');

  const bytes = buildTranscriptPdf({
    student: payload.student,
    notes,
    average,
    validatedModulesCount,
    totalModulesCount,
    nonValidatedModulesCount: Number(
      payload.non_validated_modules_count ?? payload.nonValidatedModulesCount ?? Math.max(totalModulesCount - validatedModulesCount, 0)
    ),
    mention,
    generatedAt: payload.generated_at || payload.generatedAt,
  });

  downloadBinaryPdf('releve-de-notes.pdf', bytes);
  return true;
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

  downloadPdf('emploi-du-temps.pdf', 'Emploi du temps', lines);
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
      title: 'Emploi du temps',
      lines,
      imageDataUrl: image.dataUrl,
      imageWidth: image.width,
      imageHeight: image.height,
    })
  );
};
