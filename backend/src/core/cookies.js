/**
 * Manejo minimalista de cookies sin dependencias externas.
 */

/**
 * Parsea el encabezado Cookie en un objeto clave-valor.
 * @param {string|undefined} cookieHeader
 * @returns {Record<string, string>}
 */
export function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      list[name] = decodeURIComponent(value);
    }
  });

  return list;
}

/**
 * Serializa una cookie HTTP.
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @returns {string}
 */
export function serializeCookie(name, val, options = {}) {
  let str = `${encodeURIComponent(name)}=${encodeURIComponent(val)}`;

  if (options.maxAge != null) {
    str += `; Max-Age=${Math.floor(options.maxAge)}`;
  }
  if (options.path) {
    str += `; Path=${options.path}`;
  } else {
    str += '; Path=/';
  }
  if (options.httpOnly) {
    str += '; HttpOnly';
  }
  if (options.sameSite) {
    str += `; SameSite=${options.sameSite}`;
  } else {
    str += '; SameSite=Lax';
  }
  if (options.secure) {
    str += '; Secure';
  }

  return str;
}
