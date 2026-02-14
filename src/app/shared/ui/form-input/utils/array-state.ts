import { WritableSignal } from '@angular/core';
import { updateByPath, getByPath } from './form.utils';

export function createArrayState<TModel extends object>(
  path: string,
  modelSignal: WritableSignal<TModel>
) {

  function addItem(initialValue: any = {}) {

    modelSignal.update(m => {

      const arr = getByPath(m, path);
      const safeArray = Array.isArray(arr) ? arr : [];

      return updateByPath(
        m,
        path,
        [...safeArray, initialValue]
      );
    });
  }

  function removeItem(index: number) {

    modelSignal.update(m => {

      const arr = getByPath(m, path);
      const safeArray = Array.isArray(arr) ? arr : [];

      return updateByPath(
        m,
        path,
        safeArray.filter((_, i) => i !== index)
      );
    });
  }

  return {
    addItem,
    removeItem
  };
}
