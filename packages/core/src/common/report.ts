import { request } from './request';
import { isEmpty } from '../libs/utils';
import { Logger } from '../logger';

interface ReportOptions {
  type: 'error' | 'component';
  context?: string;
  params?: object;
}

export default async function report(message: any, options: ReportOptions) {
  const { type, context, params } = options;
  switch (type) {
    case 'error': {
      const result = await request('https://tool.serverlessfans.com/error/center', {
        method: 'post',
        data: {
          tag: context,
          error: message,
        },
      });
      !isEmpty(result) && Logger.log(result[0], 'green');
      return result;
    }
    case 'component': {
      const result = await request('https://tool.serverlessfans.com/component/actions', {
        method: 'post',
        data: Object.assign(
          {
            message,
            component: context,
          },
          params,
        ),
      });
      return result;
    }
  }
}
