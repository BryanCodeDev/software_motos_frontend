export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
  }
}

export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    const message =
      (data && data.error) ||
      (data && data.message) ||
      'Error del servidor';
    throw new ApiError(status, message, data && data.details);
  }
  if (!error.response) {
    throw new ApiError(
      0,
      'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.'
    );
  }
  throw error;
};

export const showApiError = (error) => {
  try {
    return handleApiError(error);
  } catch (err) {
    if (err instanceof ApiError) {
      return err.message;
    }
    if (err && err.message) {
      return err.message;
    }
    return 'Ocurrió un error inesperado';
  }
};
