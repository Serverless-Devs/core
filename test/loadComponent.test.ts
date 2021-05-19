import { loadComponent, Logger } from '../src';

const logger = new Logger('loadComponent');

describe('loadComponent', () => {
  it('devsapp/fc-deploy', async () => {
    logger.info('开始测试 devsapp/fc-deploy');
    const res = await loadComponent('devsapp/fc-deploy');
    expect(res).not.toBeNull();
  });
  it('fc-deploy', async () => {
    logger.info('开始测试 fc-deploy');
    const res = await loadComponent('fc-deploy');
    expect(res).not.toBeNull();
  });

  it('fc-deploy@0.0.9', async () => {
    logger.info('开始测试 fc-deploy@0.0.9');
    const res = await loadComponent('fc-deploy@0.0.9');
    expect(res).not.toBeNull();
  });
});
