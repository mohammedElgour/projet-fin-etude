import { api } from '../services/api';

const FALLBACK_FILENAME = 'emploi-du-temps';

const decodeFilename = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getFilenameFromDisposition = (contentDisposition, fallbackFilename) => {
  if (!contentDisposition) {
    return fallbackFilename;
  }

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeFilename(utf8Match[1].replace(/["']/g, '').trim());
  }

  const filenameMatch = contentDisposition.match(/filename\s*=\s*("?)([^";]+)\1/i);
  if (filenameMatch?.[2]) {
    return filenameMatch[2].trim();
  }

  return fallbackFilename;
};

export const downloadTimetableFile = async ({ downloadUrl, fallbackFilename = FALLBACK_FILENAME }) => {
  if (!downloadUrl) {
    return false;
  }

  try {
    const response = await api.get(downloadUrl, {
      responseType: 'blob',
    });

    const contentDisposition = response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'] || '';
    const filename = getFilenameFromDisposition(contentDisposition, fallbackFilename);
    const blob = new Blob([response.data], {
      type: response.headers?.['content-type'] || 'application/octet-stream',
    });
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(objectUrl);

    return true;
  } catch (error) {
    console.error('Failed to download timetable file.', error);
    return false;
  }
};
