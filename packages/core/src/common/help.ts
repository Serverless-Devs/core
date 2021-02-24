import { Logger } from '../logger';
import commandLineUsage, { Section } from 'command-line-usage';

function help(sections: Section | Section[]) {
  const usage = commandLineUsage(sections);
  Logger.log(usage);
}

export default help;
