export function okResponse(data) {
  return { success: true, data };
}

export function failResponse(code, message, details) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}
