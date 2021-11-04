import { Logger } from '../logger';

export const HLogger = (context: string) => (target: any, key: string) => {
  let _val = new Logger(context);
  const getter = function () {
    return _val;
  };
  const setter = function (newVal) {
    _val = newVal;
  };
  Object.defineProperty(target, key, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  });
};
