export function getValueByPath(obj: any, path: string): any {
    if (!obj || !path) return null;
  
    return path.split('.').reduce((acc, key) => {
      return acc ? acc[key] : null;
    }, obj);
  }
  