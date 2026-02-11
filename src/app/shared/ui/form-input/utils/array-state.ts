import { updateByPath, getByPath } from './model.utils';

export function createArrayState(
  path: string,
  modelSignal: any
) {

  function addItem(initialValue: any = {}) {

    modelSignal.update((m: any) => {

      const arr = getByPath(m, path) || [];
      const newArr = [...arr, initialValue];

      return updateByPath(m, path, newArr);
    });
  }

  function removeItem(index: number) {

    modelSignal.update((m: any) => {

      const arr = getByPath(m, path) || [];
      const newArr = arr.filter((_: any, i: number) => i !== index);

      return updateByPath(m, path, newArr);
    });
  }

  return {
    addItem,
    removeItem
  };
}
