import { Component as MyComponent } from '../component';

export const Component = () => (target: any, key: string) => {
  // @ts-ignore
  let _val = this[key] || new MyComponent();

  const getter = function () {
    return _val;
  };

  const setter = function (newVal) {
    _val = newVal;
  };

  // @ts-ignore
  if (delete this[key]) {
    Object.defineProperty(target, key, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  }
};
