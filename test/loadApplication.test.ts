import { loadApplication, Logger } from '../src';

const logger = new Logger('loadApplication');

describe('loadApplication 基础组件', () => {
  it('devsapp/website-example:website-base', async () => {
    logger.info('开始测试 devsapp/website-example:website-base');
    const res = await loadApplication('devsapp/website-example:website-base');
    expect(res).not.toBeNull();
  });
  it('devsapp/website-base', async () => {
    logger.info('开始测试 devsapp/website-base');
    const res = await loadApplication('devsapp/website-base');
    expect(res).not.toBeNull();
  });
  it('website-base', async () => {
    logger.info('开始测试 website-base');
    const res = await loadApplication('website-base');
    expect(res).not.toBeNull();
  });
});

describe('loadApplication 复杂组件', () => {
  it('devsapp/midway-hook-example:midway-hook-react', async () => {
    logger.info('开始测试 devsapp/midway-hook-example:midway-hook-react');
    const res = await loadApplication('devsapp/midway-hook-example:midway-hook-react');
    expect(res).not.toBeNull();
  });
  it('devsapp/midway-hook-react', async () => {
    logger.info('开始测试 devsapp/midway-hook-react');
    const res = await loadApplication('devsapp/midway-hook-react');
    expect(res).not.toBeNull();
  });
  it('midway-hook-react', async () => {
    logger.info('开始测试 midway-hook-react');
    const res = await loadApplication('midway-hook-react');
    expect(res).not.toBeNull();
  });
});

describe('loadApplication ts重载', () => {
  it('devsapp/start-malagu', async () => {
    logger.info('开始测试 devsapp/start-malagu ts重载');
    const res = await loadApplication({ source: 'devsapp/start-malagu', name: 'start-malagu01' });
    expect(res).not.toBeNull();
  });
});
