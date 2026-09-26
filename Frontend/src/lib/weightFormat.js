export function formatWeightLabel(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const normalized = raw.replace(/\s+/g, ' ');
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);

  if (!match) return normalized;

  const [, amount, unit] = match;
  if (!unit) {
    const numericAmount = Number(amount);
    if (Number.isFinite(numericAmount) && numericAmount >= 1000) {
      return `${numericAmount / 1000} kg`;
    }
    return `${amount} gm`;
  }

  const lowerUnit = unit.toLowerCase();
  const displayUnit = lowerUnit === 'g' || lowerUnit === 'gm' || lowerUnit === 'gram' || lowerUnit === 'grams'
    ? 'gm'
    : lowerUnit === 'kg' || lowerUnit === 'kilogram' || lowerUnit === 'kilograms'
      ? 'kg'
      : unit;

  return `${amount} ${displayUnit}`;
}

export function toBackendWeightValue(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const match = raw.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);
  if (!match) return raw;

  const amount = Number(match[1]);
  const unit = (match[2] || 'gm').toLowerCase();

  if (!Number.isFinite(amount)) return raw;
  if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
    return String(amount * 1000);
  }

  return String(amount);
}
