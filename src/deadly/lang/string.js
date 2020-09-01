// deadly.lang.string.truncate(group[0], 20)
export function truncate(s, length, truncation) {
  // Enforces that s is not more then `length` characters long.
  // Example:
  // string.truncate("123456789", 5) // => "12..."
  length = length || 30;
  truncation = truncation === undefined ? '...' : truncation;
  return s.length > length ?
    s.slice(0, length - truncation.length) + truncation : String(s);
}