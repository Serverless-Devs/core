import getMAC from 'getmac';
import {
  getSetConfig,
  isDebugMode,
  makeUnderLine,
  isCiCdEnv,
  getCoreVersion,
  getRootHome,
  getCliVersion,
} from '../libs/common';
import { logger } from '../libs/utils';
import chalk from 'chalk';
import getYamlContent from '../common/getYamlContent';
import { get, first, values, filter } from 'lodash';
import { getTemplatePath } from '../common/parse/utils';
import got from 'got';
import isDocker from 'is-docker';

export const red = chalk.hex('#fd5750');
export const yellow = chalk.hex('#F3F99D');
export const bgRed = chalk.hex('#000').bgHex('#fd5750');

export function getVersion() {
  const options = [
    getCliVersion() ? `@serverless-devs/s: ${getCliVersion()}` : undefined,
    getCoreVersion() ? `core: ${getCoreVersion()}` : undefined,
    `s-home: ${getRootHome()}`,
    `${process.platform}-${process.arch}`,
    `node-${process.version}`,
  ];
  return filter(options, (o) => o).join(', ');
}

const _AiRequest = (category, message) => {
  if (isDocker() || isCiCdEnv()) {
    // 在CICD环境中不处理
    return;
  }
  return got(
    `http://qaapis.devsapp.cn/apis/v1/search?category=${category}&code=TypeError&s=${message}`,
    {
      timeout: 2000,
      json: true,
    },
  )
    .then((list) => {
      const shorturl = get(list.body, 'shorturl');
      if (shorturl) {
        console.log(
          `AI Tips:\nYou can try to solve the problem through: ${chalk.underline(shorturl)}\n`,
        );
      }
    })
    .catch(() => {
      // exception
    });
};

export const getErrorMessage = async (error: Error, prefix) => {
  const configOption = { traceId: '', catchableError: false };
  const getPid = () => {
    try {
      return getMAC().replace(/:/g, '');
    } catch (error) {
      return 'unknown';
    }
  };

  const analysis = await getSetConfig('analysis');
  if (analysis !== 'disable') {
    configOption.traceId = `${getPid()}${Date.now()}`;
  }

  const isDebug = isDebugMode ? isDebugMode() : undefined;
  if (isDebug) {
    console.log(error);
    return configOption;
  }

  const message = error.message ? error.message : '';
  let jsonMsg;
  try {
    jsonMsg = JSON.parse(message);
  } catch (error) {}

  if (jsonMsg && jsonMsg.tips) {
    const messageStr = jsonMsg.message ? `Message: ${jsonMsg.message}\n` : '';
    const tipsStr = jsonMsg.tips ? `* ${makeUnderLine(jsonMsg.tips.replace(/\n/, '\n* '))}` : '';
    logger.log(
      `\n${chalk.hex('#000').bgYellow('WARNING:')}\n======================\n${tipsStr}\n`,
      'yellow',
    );
    console.log(chalk.grey(messageStr));
    configOption.catchableError = true;
  } else {
    console.log(red(`✖ ${prefix}\n`));
    console.log(`${bgRed('ERROR:')}\n${message}\n`);
    if (analysis !== 'disable') {
      try {
        const templateFile = await getTemplatePath();
        const content = await getYamlContent(templateFile);
        const category = get(
          first(values(get(content, 'services'))),
          'component',
          'serverless-devs',
        );
        await _AiRequest(category, message);
      } catch (error) {
        // throw error
      }
    }
  }

  return configOption;
};
