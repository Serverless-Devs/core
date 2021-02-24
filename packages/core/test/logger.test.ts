import { HLogger, ILogger } from '../src';

class LoggerDemo {
  @HLogger('sss') log: ILogger;
}

describe('logger.test', () => {
  it('test for class', () => {
    const demo = new LoggerDemo();
    expect(demo.log.debug).not.toBeNull();
  });
});
