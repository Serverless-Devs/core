import chalk from 'chalk';
import minimist from 'minimist';
import get from 'lodash.get';
const prettyoutput = require('prettyoutput');
import ansiEscapes from 'ansi-escapes';

// CLI Colors
const white = (str) => str;

type LogColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'whiteBright'
  | 'gray';

function getDebugFromEnv() {
  const temp_params = get(process, 'env.temp_params');
  if (temp_params) {
    const temp = temp_params.split(' ');
    const debugList = temp.filter((item) => item === '--debug');
    return debugList.length > 0;
  }
}

export interface ILogger {
  // 打印
  log: (message: any, color?: LogColor) => any;
  // 当成日志
  info: (...data: any[]) => any;
  debug: (...data: any[]) => any;
  warn: (...data: any[]) => any;
  error: (...data: any[]) => any;
}

const args = minimist(process.argv.slice(2));
const getEnableDebug = () => args.debug || getDebugFromEnv();

// function getSecretValue(val: string) {
//   const [key, value] = val.split(': ');
//   const valueLength = value.length;
//   if (valueLength < 6) return val;

//   let formatVal = value.slice(0, 4);
//   for (let i = 0; i < valueLength - 10; i++) {
//     formatVal += '*';
//   }
//   formatVal += value.slice(valueLength - 6, valueLength);
//   return `${key}: ${formatVal}`;
// }

// function secretCredentials(...data: any[]) {
//   const list = [];
//   for (const iterator of data) {
//     if (typeof iterator.includes !== 'function') return data;
//     let str = iterator;
//     if (iterator.includes('AccountID')) {
//       const reg = /"AccountID(.*?)\n/g;
//       const arr = iterator.match(reg);
//       if (!arr) return;
//       arr &&
//         arr.forEach((item) => {
//           str = str.replace(item, getSecretValue(item));
//         });
//     }
//     if (iterator.includes('AccessKeyID')) {
//       const reg = /"AccessKeyID(.*?)\n/g;
//       const arr = iterator.match(reg);
//       arr &&
//         arr.forEach((item) => {
//           str = str.replace(item, getSecretValue(item));
//         });
//     }
//     if (iterator.includes('AccessKeySecret')) {
//       const reg = /"AccessKeySecret(.*?)\n/g;
//       const arr = iterator.match(reg);
//       arr &&
//         arr.forEach((item) => {
//           str = str.replace(item, getSecretValue(item));
//         });
//     }
//     list.push(str);
//   }
//   return list;
// }

export class Logger {
  context: string;
  constructor(context?: string) {
    this.context = context;
  }
  static log(message: any, color?: LogColor) {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  static debug(name: string, data) {
    if (getEnableDebug()) {
      console.log(`${chalk.blue(`[DEBUG] [${name}] - `)}${data}`);
    }
  }

  static info(name: string, data) {
    console.log(`${chalk.green(`[INFO ] [${name}] - `)}${data}`);
  }

  static warn(name: string, data) {
    console.log(`${chalk.yellow(`[WARN ] [${name}] - `)}${data}`);
  }

  static error(name: string, data) {
    console.log(`${chalk.red(`[ERROR] [${name}] - `)}${data}`);
  }
  log(message: any, color?: LogColor) {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  debug(data) {
    if (getEnableDebug()) {
      console.log(`${chalk.blue(`[DEBUG] [${this.context}] - `)}${data}`);
    }
  }

  info(data) {
    console.log(`${chalk.green(`[INFO ] [${this.context}] - `)}${data}`);
  }

  warn(data) {
    console.log(`${chalk.yellow(`[WARN ] [${this.context}] - `)}${data}`);
  }

  error(data) {
    console.log(`${chalk.red(`[ERROR] [${this.context}] - `)}${data}`);
  }

  output(outputs, indent = 0) {
    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown);
    process.stdout.write(
      white(
        prettyoutput(
          outputs,
          {
            colors: {
              keys: 'bold',
              dash: null,
              number: null,
              string: null,
              true: null,
              false: null,
            },
            maxDepth: 10,
          },
          indent,
        ),
      ),
    );
  }
}
