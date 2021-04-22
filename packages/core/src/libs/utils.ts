/**
 * @description 用于存放工具函数
 */

import { uid } from 'uid/secure';
import * as fs from 'fs-extra';
import { Logger } from '../logger';

export const merge = require('lodash.merge');

export const isUndefined = (obj: any): obj is undefined => typeof obj === 'undefined';

export const isObject = (fn: any): fn is object => !isNil(fn) && typeof fn === 'object';

export const isPlainObject = (fn: any): fn is object => {
  if (!isObject(fn)) {
    return false;
  }
  const proto = Object.getPrototypeOf(fn);
  if (proto === null) {
    return true;
  }
  const ctor = Object.prototype.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (
    typeof ctor === 'function' &&
    ctor instanceof ctor &&
    Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object)
  );
};

export const isFunction = (fn: any): boolean => typeof fn === 'function';
export const isString = (fn: any): fn is string => typeof fn === 'string';
export const isConstructor = (fn: any): boolean => fn === 'constructor';
export const isNil = (obj: any): obj is null | undefined => isUndefined(obj) || obj === null;
export const isEmpty = (array: any): boolean => !(array && array.length > 0);
export const isSymbol = (fn: any): fn is symbol => typeof fn === 'symbol';

// TODO: add types
export const omitObject = (object, callback): { [key: string]: any } => {
  const newObj = {};
  for (const key in object) {
    const value = object[key];
    if (callback(value, key)) {
      newObj[key] = value;
    }
  }
  return newObj;
};

export const map = (object, callback): Array<{ [key: string]: any }> => {
  const newList = [];
  for (const key in object) {
    const value = object[key];
    newList.push(callback(value, key));
  }
  return newList;
};
export const uuid = uid;

export function readJsonFile(filePath: string) {
  const logger = new Logger('S_CORE');
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } else {
    logger.debug(`readJsonFile: the file ${filePath} does not exist`);
  }
}

export function writeJsonFile(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function sleep(timer: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), timer);
  });
}
