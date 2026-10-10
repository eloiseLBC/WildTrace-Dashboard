export const validNumber = (value) => typeof value === "number" && Number.isFinite(value);
export function mean(values) {
  const valid = values.filter(validNumber);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}
export function summarize(values) {
  const valid = values.filter(validNumber);
  return { avg: mean(valid), min: valid.length ? valid.reduce((min, value) => Math.min(min, value), Infinity) : null,
    max: valid.length ? valid.reduce((max, value) => Math.max(max, value), -Infinity) : null, count: valid.length };
}
export function measurement(value, min = -Infinity, max = Infinity) {
  return validNumber(value) && value >= min && value <= max ? value : null;
}
