import * as fs from 'fs-extra';
import { startsWith, get, merge, replace, isNil, includes, isEmpty } from 'lodash';
import { getCurrentPath } from './utils';
import path from 'path';
import yaml from 'js-yaml';
import { ICredentials } from './interface';
import { COMMON_VARIABLE_TYPE_REG, SPECIALL_VARIABLE_TYPE_REG } from '../constant';
import { HumanWarning } from '../error';

const OTHER_BASIC_DATA_TYPE = ['[object Number]', '[object Boolean]'];

export default class Parse {
  private parsedObj: any = {};
  private dependenciesMap: { [key: string]: any } = {};
  private globalJsonKeyMap: any = {};
  private credentials: ICredentials;
  private unparsedField: string[] = [];

  constructor(protected spath?: string) {
    if (fs.existsSync(spath)) {
      try {
        this.parsedObj = this.getFileObj(spath);
      } catch (error) {
        throw error;
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
        fileObj = fs.readJSONSync(filePath);
      }
    } catch (error) {}
    return fileObj;
  }

  private findVariableValue(variableObj: any) {
    const { variableName, type, funName, funVariable } = variableObj;
    const result = '';
    if (type === 'Literal') {
      if (!isNil(this.globalJsonKeyMap[variableName])) return this.globalJsonKeyMap[variableName];
      if (!isNil(this.globalJsonKeyMap[`services.${variableName}`]))
        return this.globalJsonKeyMap[`services.${variableName}`];
      const newVariableName = `\${${variableName}}`;
      const shouldCollect = startsWith(variableName, 'env.') || startsWith(variableName, 'vars.');
      if (shouldCollect && !includes(this.unparsedField, newVariableName)) {
        this.unparsedField.push(newVariableName);
      }
      return newVariableName;
    }
    if (type === 'Fun' && (funName === 'Env' || funName === 'env')) {
      return process.env[funVariable];
    }
    if (type === 'Fun' && (funName === 'Path' || funName === 'path')) {
      return getCurrentPath(funVariable, this.spath);
    }

    if (type === 'Fun' && (funName === 'File' || funName === 'file')) {
      return this.getFileObj(funVariable);
    }
    if (type === 'Fun' && funName === 'config') {
      return this.credentials ? this.credentials[funVariable] : '${' + variableName + '}';
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
        let tmp = objValue;
        for (const iterator of regResult) {
          const matchResult = replace(iterator, COMMON_VARIABLE_TYPE_REG, '$1'); // get match result like projectName.key.variable
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
          if (!isNil(realValue)) {
            tmp =
              Object.prototype.toString.call(realValue) === '[object String]'
                ? replace(tmp, iterator, realValue)
                : realValue;
          }
        }
        return tmp;
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

  private replaceVariable(variable) {
    const _variable = variable.services;
    Object.keys(_variable).forEach((key) => {
      const objValue = _variable[key];
      variable.services[key] = this.iteratorToSetValue(objValue, key);
    });
    return variable;
  }

  setCredentials(val: ICredentials) {
    this.credentials = val;
  }
  clearGlobalKey(val: string) {
    const tmp = {};
    for (const key in this.globalJsonKeyMap) {
      if (!startsWith(key, val)) {
        tmp[key] = this.globalJsonKeyMap[key];
      }
    }
    this.globalJsonKeyMap = tmp;
    return this;
  }
  getGlobalMagic() {
    return this.globalJsonKeyMap;
  }
  beforeInit(value: object) {
    this.parsedObj = value;
    return this;
  }
  async init(
    obj?: object,
  ): Promise<{ realVariables: Record<string, any>; dependenciesMap: Record<string, any> }> {
    const val = obj ? merge({}, this.parsedObj, obj) : this.parsedObj;
    this.generateMagicVariables(val);
    const realVariables = this.replaceVariable(val);
    return { realVariables, dependenciesMap: this.dependenciesMap };
  }
  warnUnparsedField() {
    if (isEmpty(this.unparsedField)) return;
    new HumanWarning({
      warningMessage: `${this.unparsedField} was not parsed successfully and may not have caused an error.`,
    });
  }
}
