function readErrorMessage(error: unknown): string | null {
  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return null;
}

export const getErrorMessage = (error: unknown, fallback: string): string => {
  return readErrorMessage(error) ?? fallback;
};

export const isUnauthorizedError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const record = error as { code?: unknown; status?: unknown };
  if (record.status === 401 || record.code === 401 || record.code === '401' || record.code === 'PGRST301') {
    return true;
  }

  const message = readErrorMessage(error);
  return Boolean(message && /invalid jwt|jwt expired|unauthorized|not authenticated|no suitable key/i.test(message));
};
