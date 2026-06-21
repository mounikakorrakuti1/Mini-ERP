export function usd(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `INR ${Number.isFinite(n) ? n.toLocaleString('en-IN') : '0'}`;
}
