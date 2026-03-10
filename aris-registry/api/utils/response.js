export const okResponse = (data) => ({ success: true, ...data });
export const failResponse = (code, message) => ({ success: false, error: { code, message } });