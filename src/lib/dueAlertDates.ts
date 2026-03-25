export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDueAlertCalendarDates(reference: Date = new Date()): string[] {
  const base = new Date(reference);
  base.setHours(0, 0, 0, 0);
  return [0, 3, 7].map((add) => {
    const x = new Date(base);
    x.setDate(x.getDate() + add);
    return formatLocalYmd(x);
  });
}
