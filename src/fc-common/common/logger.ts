import { Logger } from '../../logger';

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

export default class ComponentLogger {
  static CONTENT = 'fc-common';
  static setContent(content) {
    ComponentLogger.CONTENT = content;
  }
  static log(m, color?: LogColor) {
    Logger.log(m, color);
  }
  static info(m) {
    Logger.info(ComponentLogger.CONTENT, m);
  }

  static debug(m) {
    Logger.debug(ComponentLogger.CONTENT, m);
  }

  static error(m) {
    Logger.error(ComponentLogger.CONTENT, m);
  }

  static warning(m) {
    Logger.warn(ComponentLogger.CONTENT, m);
  }

  static success(m) {
    Logger.log(m, 'green');
  }
}
