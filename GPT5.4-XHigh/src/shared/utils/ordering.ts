import { boardPositionStep } from "@/src/shared/types/domain";

export function buildOrderedPositions(ids: readonly string[]): Map<string, number> {
  const positions = new Map<string, number>();

  ids.forEach((id, index) => {
    positions.set(id, (index + 1) * boardPositionStep);
  });

  return positions;
}

export function buildTemporaryPositions(ids: readonly string[]): Map<string, number> {
  const positions = new Map<string, number>();

  ids.forEach((id, index) => {
    positions.set(id, -((index + 1) * boardPositionStep));
  });

  return positions;
}

export function nextPosition(values: readonly number[]): number {
  const maxValue = values.length === 0 ? 0 : Math.max(...values);
  return maxValue + boardPositionStep;
}

export function moveId<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  const result = [...items];
  const [moved] = result.splice(fromIndex, 1);

  if (moved === undefined) {
    return result;
  }

  result.splice(toIndex, 0, moved);
  return result;
}

export function clampIndex(value: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > length) {
    return length;
  }

  return value;
}
