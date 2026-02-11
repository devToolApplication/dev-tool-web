export function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function updateByPath(obj: any, path: string, value: any) {

  const keys = path.split('.');
  const last = keys.pop()!;

  const newObj = { ...obj };
  let current = newObj;

  keys.forEach(k => {
    current[k] = { ...current[k] };
    current = current[k];
  });

  current[last] = value;

  return newObj;
}
