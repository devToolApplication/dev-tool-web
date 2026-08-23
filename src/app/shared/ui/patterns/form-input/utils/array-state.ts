import type { WritableSignal } from '@angular/core';
import { updateByPath, getByPath } from './form.utils';

export function createArrayState<TModel extends object>(
  path: string,
  modelSignal: WritableSignal<TModel>,
) {
  function addItem(initialValue: unknown = {}) {
    modelSignal.update((m) => {
      const arr = getByPath(m, path);
      const safeArray = Array.isArray(arr) ? Array.from(arr as readonly unknown[]) : [];

      return updateByPath(m, path, [...safeArray, initialValue]);
    });
  }

  function removeItem(index: number) {
    modelSignal.update((m) => {
      const arr = getByPath(m, path);
      const safeArray = Array.isArray(arr) ? Array.from(arr as readonly unknown[]) : [];

      return updateByPath(
        m,
        path,
        safeArray.filter((_, i) => i !== index),
      );
    });
  }

  function moveItem(index: number, direction: -1 | 1) {
    modelSignal.update((m) => {
      const arr = getByPath(m, path);
      const safeArray = Array.isArray(arr) ? Array.from(arr as readonly unknown[]) : [];
      const targetIndex = index + direction;

      if (
        index < 0 ||
        index >= safeArray.length ||
        targetIndex < 0 ||
        targetIndex >= safeArray.length
      ) {
        return m;
      }

      const [item] = safeArray.splice(index, 1);
      safeArray.splice(targetIndex, 0, item);

      return updateByPath(m, path, safeArray);
    });
  }

  return {
    addItem,
    removeItem,
    moveItem,
  };
}
