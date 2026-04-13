/** Dev-only console helpers — no output in production builds. */
const IS_DEV = import.meta.env.DEV;

export function devLog(...args) {
  if (IS_DEV) console.log(...args);
}

export function devWarn(...args) {
  if (IS_DEV) console.warn(...args);
}

export function devError(...args) {
  if (IS_DEV) console.error(...args);
}

export function devDebug(...args) {
  if (IS_DEV) console.debug(...args);
}
