/**
 * @description 用于存放工具函数
 */

import { nanoid } from 'nanoid';
import * as fs from 'fs-extra';
import { Logger } from '../logger';
import report from '../common/report';
import _ from 'lodash';

export const logger = new Logger('S-CORE');

export function getServerlessDevsTempArgv() {
  try {
    return JSON.parse(process.env.serverless_devs_temp_argv);
  } catch (error) {
    return [];
  }
}
export const { merge } = require('lodash');

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
export const uuid = nanoid;

export function readJsonFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    try {
      return JSON.parse(data);
    } catch (error) {
      report({
        type: 'jsError',
        content: `${error.message}||${error.stack}`,
      });
    }
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

export function isCICDEnv() {
  for (const key in process.env) {
    if (key.startsWith('CLOUDSHELL')) return true;
    if (key.startsWith('PIPELINE')) return true;
    if (key.startsWith('GITHUB')) return true;
    if (key.startsWith('GITLAB')) return true;
    if (key.startsWith('JENKINS')) return true;
  }
  return false;
}