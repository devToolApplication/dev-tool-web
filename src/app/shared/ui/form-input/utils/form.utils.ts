import { GridWidth } from "../models/form-config.model";

export function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function updateByPath(obj: any, path: string, value: any) {

  const keys = path.split('.');
  const lastKey = keys.pop()!;

  const newObj = Array.isArray(obj)
    ? [...obj]
    : { ...obj };

  let current: any = newObj;

  keys.forEach((key, index) => {

    const nextKey = keys[index + 1];

    const isNextIndex = !isNaN(Number(nextKey));

    if (Array.isArray(current[key])) {
      current[key] = [...current[key]];
    } else if (typeof current[key] === 'object' && current[key] !== null) {
      current[key] = { ...current[key] };
    } else if (isNextIndex) {
      current[key] = [];
    } else {
      current[key] = {};
    }

    current = current[key];
  });

  if (Array.isArray(current)) {
    current[Number(lastKey)] = value;
  } else {
    current[lastKey] = value;
  }

  return newObj;
}

export function getColClass(width?: GridWidth): string {
  const map: Record<GridWidth, string> = {
    '1/2': 'col-span-6',
    '1/3': 'col-span-4',
    '1/4': 'col-span-3',
    '1/6': 'col-span-2',
    'full': 'col-span-12'
  };

  return map[width ?? 'full'];
}