/**
 * Serializes JSON-LD without allowing schema values to terminate or alter the
 * surrounding script element.
 */
export function serializeJsonLd(value) {
  return (JSON.stringify(value) ?? 'null')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
