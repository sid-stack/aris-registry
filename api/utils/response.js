export const okResponse = (data) => ({ success: true, ...data });
export const failResponse = (code, message) => ({ success: false, error: { code, message } });

/**
 * Strip null / undefined / empty-string fields from an object before
 * sending to the client. Handles nested objects and arrays.
 * Moved here from the deleted api/src/promptBuilder.js.
 */
export function suppressEmptyFields(data) {
  if (!data || typeof data !== "object") return data;
  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      const filtered = value.filter(item => item !== null && item !== undefined && item !== "");
      if (filtered.length > 0) clean[key] = filtered;
    } else if (typeof value === "object") {
      const nested = suppressEmptyFields(value);
      if (Object.keys(nested).length > 0) clean[key] = nested;
    } else {
      clean[key] = value;
    }
  }
  return clean;
}