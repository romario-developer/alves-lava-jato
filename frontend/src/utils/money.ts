// Formata entrada numerica em "0,00" usando apenas digitos
export function maskMoneyInput(value: string, allowEmpty = false): string {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return allowEmpty ? '' : '0,00';
  const number = parseInt(digits, 10);
  const cents = (number / 100).toFixed(2);
  return cents.replace('.', ',');
}

export function moneyToNumber(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function numberToMoneyString(value: number): string {
  const cents = Math.round((value || 0) * 100);
  return maskMoneyInput(String(cents));
}
