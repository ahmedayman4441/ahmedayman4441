export const BACKUP_FOLDER_NAME = 'backups';

export const ensureBackupFolder = (): string => {
  if (typeof window === 'undefined') return '';

  try {
    const root = window.location.href.includes('file://')
      ? window.location.pathname.replace(/\/[^/]*$/, '')
      : '/';

    return root;
  } catch {
    return '';
  }
};

export const saveBackupFile = (backup: unknown, fileName: string): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const data = JSON.stringify(backup, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to save backup file', error);
    return false;
  }
};
