import { getErrorMessage, getVersion } from './utils';
import chalk from 'chalk';
import report from '../common/report';

interface IConfigs {
  error: Error;
  prefix?: string;
}

function underline(prefix: string, link: string) {
  return `${chalk.gray(prefix)}${chalk.gray.underline(link)}`;
}
const HandleError = async (configs: IConfigs) => {
  const { error, prefix = 'Message:' } = configs;
  const { traceId, catchableError } = await getErrorMessage(error, prefix);
  if (!catchableError) {
    if (traceId) {
      console.log(chalk.gray(`TraceId:     ${traceId}`));
    }
    console.log(chalk.gray(`Environment: ${getVersion()}`));
    console.log(underline('Documents:   ', 'https://www.serverless-devs.com'));
    console.log(
      underline('Discussions: ', 'https://github.com/Serverless-Devs/Serverless-Devs/discussions'),
    );
    console.log(
      underline('Issues:      ', 'https://github.com/Serverless-Devs/Serverless-Devs/issues\n'),
    );

    if (traceId) {
      console.log(
        chalk.gray(
          `Please copy traceId: ${traceId} and join Dingding group: 33947367 for consultation.`,
        ),
      );
    }
  }
  console.log(chalk.gray("You can run 's clean --all' to clean Serverless devs."));

  if (traceId && !catchableError) {
    await report({
      type: 'jsError',
      content: `${error.message}||${error.stack}`,
      traceId: traceId,
    });
  }
};

export default HandleError;
