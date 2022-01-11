import * as fs from 'fs';
import * as path from 'path';
import { startsWith, get } from 'lodash';
import yaml from 'js-yaml';
import { cloneDeep } from 'lodash';

interface MAP_OBJECT {
  [key: string]: any;
}

const COMMON_VARIABLE_TYPE_REG = new RegExp(/\$\{(.*)\}/, 'i');
const SPECIALL_VARIABLE_TYPE_REG = new RegExp(/(.*)\((.*)\)/, 'i');

const OTHER_BASIC_DATA_TYPE = ['[object Number]', '[object Boolean]'];

export default class Parse {
  private parsedObj: any = {};
  private dependenciesMap: { [key: string]: any } = {};
  private globalJsonKeyMap: any = {};

  constructor(protected path: string) {
    if (fs.existsSync(path)) {
      try {
        this.parsedObj = this.getFileObj(path);
      } catch (ex) {
        throw new Error(ex.message);
      }
    }
  }

  private getFileObj(filePath: string) {
    let fileObj = {};
    try {
      const extname = path.extname(filePath);
      if (extname.indexOf('.yaml') !== -1 || extname.indexOf('.yml') !== -1) {
        fileObj = yaml.load(fs.readFileSync(filePath, 'utf8'));
      }
      if (extname.indexOf('.json') !== -1) {
        fileObj = JSON.parse(fs.readFileSync(filePath).toString());
      }
    } catch (error) {}
    return fileObj;
  }

  private findVariableValue(variableObj: any) {
    const { variableName, type, funName, funVariable } = variableObj;
    const result = '';
    if (type === 'Literal') {
      return (
        this.globalJsonKeyMap[variableName] ||
        this.globalJsonKeyMap[`services.${variableName}`] ||
        '${' + variableName + '}'
      );
    }
    if (type === 'Fun' && (funName === 'Env' || funName === 'env')) {
      return process.env[funVariable];
    }
    if (type === 'Fun' && (funName === 'Path' || funName === 'path')) {
      return path.join(process.cwd(), funVariable);
    }

    if (type === 'Fun' && (funName === 'File' || funName === 'file')) {
      return this.getFileObj(funVariable);
    }
    return result;
  }

  private generateMagicVariables(value: any, arr: any[] = [], parentStr = '') {
    if (Object.prototype.toString.call(value) === '[object Object]') {
      if (parentStr !== '') {
        parentStr = `${parentStr}.`;
      }
      Object.keys(value).map((key) => {
        const showKey = `${parentStr}${key}`;
        const objValue = value[key];
        arr.push(showKey);
        arr.concat(this.generateMagicVariables(objValue, arr, `${showKey}`));
        this.globalJsonKeyMap[showKey] = objValue;
      });
    } else if (Object.prototype.toString.call(value) === '[object Array]') {
      value.forEach((_arrValue: any, i: number) => {
        const showKey = `${parentStr}[${i}]`;
        arr.push(showKey);
        arr.concat(this.generateMagicVariables(_arrValue, arr, `${showKey}`));
        this.globalJsonKeyMap[showKey] = _arrValue;
      });
    } else {
      arr = [];
    }
    return arr;
  }

  private iteratorToSetValue(objValue: any, topKey: string, parentKey?: any) {
    if (OTHER_BASIC_DATA_TYPE.includes(Object.prototype.toString.call(objValue))) {
      return objValue;
    }
    if (Object.prototype.toString.call(objValue) === '[object String]') {
      const regResult = objValue.match(COMMON_VARIABLE_TYPE_REG);
      if (regResult) {
        const matchResult = regResult[1]; // get match result like projectName.key.variable
        const variableObj = {
          variableName: matchResult,
          type: 'Literal',
          funName: null,
          funVariable: '',
        };
        const funMatchResult = matchResult.match(SPECIALL_VARIABLE_TYPE_REG);
        if (funMatchResult) {
          variableObj.funName = funMatchResult[1];
          variableObj.funVariable = funMatchResult[2];
          variableObj.type = 'Fun';
        } else {
          let topKeyDependenciesMap = this.dependenciesMap[topKey];
          if (!topKeyDependenciesMap) {
            topKeyDependenciesMap = {};
          }
          const dependProjName = matchResult.split('.')[0];
          topKeyDependenciesMap[dependProjName] = 1; // Dependent priority
          this.dependenciesMap[topKey] = topKeyDependenciesMap;
        }

        let realValue = startsWith(matchResult, 'env.')
          ? get(process, matchResult)
          : this.findVariableValue(variableObj);

        return Object.prototype.toString.call(realValue) === '[object String]'
          ? objValue.replace(COMMON_VARIABLE_TYPE_REG, realValue)
          : realValue;
      }

      if (!this.dependenciesMap[topKey] || Object.keys(this.dependenciesMap[topKey]).length == 0) {
        this.dependenciesMap[topKey] = {};
      }
      return objValue;
    }
    if (Object.prototype.toString.call(objValue) === '[object Array]') {
      return objValue.map((item: any) => {
        return this.iteratorToSetValue(item, topKey);
      });
    }
    if (Object.prototype.toString.call(objValue) === '[object Object]') {
      Object.keys(objValue).forEach((key) => {
        objValue[key] = this.iteratorToSetValue(objValue[key], topKey, parentKey || key);
      });
      return objValue;
    }
  }

  private replaceVariable(variable: any | MAP_OBJECT) {
    const _variable = variable.services;
    Object.keys(_variable).forEach((key) => {
      const objValue = _variable[key];
      _variable[key] = this.iteratorToSetValue(objValue, key);
    });
    if (variable.services) {
      variable.services = _variable;
    } else {
      variable = _variable;
    }
    return cloneDeep(variable);
  }

  async init(): Promise<{ realVariables: any; parsedObj: any; dependenciesMap: any }> {
    this.generateMagicVariables(this.parsedObj);
    const realVariables = this.replaceVariable(this.parsedObj);
    return { realVariables, parsedObj: this.parsedObj, dependenciesMap: this.dependenciesMap };
  }
}
