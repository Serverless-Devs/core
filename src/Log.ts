const colors = require('colors');
const os = require('os');
const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
export default class Component {
  private getSpace(num:number) {
    const tempSpace = ' ';
    let tempResult = '';
    for (let i = 0; i < (num > 0 ? parseInt(String(num)) : 0); i++) {
      tempResult = tempResult + tempSpace;
    }
    return tempResult;
  }

  private getLogMessage(message: string, type: string, style:number, num:number) {
    return this.getSpace(num || 0) + (style === 1 ? type : '') + message;
  }

  private isColor() {
    const profPath = path.join(os.homedir(), `.s/set-config.yml`);
    try {
      const profile = yaml.safeLoad(fs.readFileSync(profPath, 'utf8')) || {};
      return profile['output-color'];
    } catch (err) {
      return true;
    }
  }
  log(message: any, option?:any) {
    const {style, num, output} = option || {};
    message = this.getLogMessage(message, '[LOG] ', style || 0, num || 2);
    if (process.env['verbose'] === 'true' || output === true) {
      console.log(this.isColor() ? colors.grey(message) : message);
    }
  }

  warn(message: any, option?:any) {
    const {style, num} = option || {};
    message = this.getLogMessage(message, '[WARN] ', style || 0, num || 2);
    console.log(this.isColor() ? colors.yellow(message) : message);
  }

  error(message: any, option?:any) {
    const {style, num} = option || {};
    message = this.getLogMessage(message, '[ERROR] ', style || 0, num || 2);
    // throw new Error(message);
    console.log(this.isColor() ? colors.red(message) : message);
  }

  info(message: any, option?:any) {
    const {style, num} = option || {};
    message = this.getLogMessage(message, '[INFO] ', style || 0, num || 2);
    console.log(this.isColor() ? colors.blue(message) : message);
  }

  success(message: any, option?:any) {
    const {style, num} = option || {};
    message = this.getLogMessage(message, '[LOG] ', style || 0, num || 2);
    console.log(this.isColor() ? colors.green(message) : message);
  }
}