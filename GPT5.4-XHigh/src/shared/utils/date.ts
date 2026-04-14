export function toIsoString(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.toISOString();
}

export function toIsoStringRequired(value: Date): string {
  return value.toISOString();
}

export function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  return new Date(value);
}

export function startOfDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

export function differenceInCalendarDays(left: Date, right: Date): number {
  const leftDay = startOfDay(left).getTime();
  const rightDay = startOfDay(right).getTime();
  return Math.round((leftDay - rightDay) / (24 * 60 * 60 * 1000));
}
