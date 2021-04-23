import * as MyProgressBar from 'progress';

const { green, white } = require('chalk');

const ProgressBar = MyProgressBar.default ? MyProgressBar.default : MyProgressBar;

export enum ProgressType {
  Bar,
  Loading,
}

export interface ProgressBarOptions {
  /**
   * Total number of ticks to complete.
   */
  total: number;

  /**
   * current completed index
   */
  curr?: number;

  /**
   * head character defaulting to complete character
   */
  head?: string;

  /**
   * The displayed width of the progress bar defaulting to total.
   */
  width?: number;

  /**
   * minimum time between updates in milliseconds defaulting to 16
   */
  renderThrottle?: number;

  /**
   * The output stream defaulting to stderr.
   */
  stream?: NodeJS.WritableStream;

  /**
   * Completion character defaulting to "=".
   */
  complete?: string;

  /**
   * Incomplete character defaulting to "-".
   */
  incomplete?: string;

  /**
   * Option to clear the bar on completion defaulting to false.
   */
  clear?: boolean;

  /**
   * Optional function to call when the progress bar completes.
   */
  callback?: Function;
}

const DEFAULT_BAR_FORMAT = `downloading ${green(
  ':loading',
)} ((:bar)) :current/:total(Bytes) :percent :etas`;
const DEFAULT_LOADING_FORMAT = `${green(':loading')} ((:bar))`;

export class ProgressService {
  private bar: ProgressBar;
  private readonly progressType: ProgressType;
  private backward: boolean;

  /**
   * @param type, Bar: a progress bar with total size known, Loading: a loading style with unknown total size
   * @param format, format of progress bar
   * @param options, options of progress bar, with type Loading, just set {width:50, total:100}
   */
  constructor(
    protected readonly type: ProgressType,
    protected readonly options: ProgressBarOptions,
    format?: string,
  ) {
    const opts = ProgressService.initProgressBarOptions(type, options);
    const fmt = ProgressService.initFormat(type, format);
    this.progressType = type;
    // init backward for loading type
    this.backward = false;

    // @ts-ignore
    const pb = new ProgressBar(fmt, opts);
    const loadingChars = ['⣴', '⣆', '⢻', '⢪', '⢫'];
    // set tick callback with loading chars
    const oldTick = pb.tick;
    // @ts-ignore
    pb.tick = (len, tokens) => {
      const newTokens = Object.assign(
        {
          loading: loadingChars[parseInt(String(Math.random() * 5))],
        },
        tokens,
      );
      // console.log(newTokens);
      oldTick.call(pb, len, newTokens);
    };
    this.bar = pb;
  }

  private static initFormat(type: ProgressType, format: string | undefined): string {
    if (!format) {
      if (type === ProgressType.Bar) {
        format = DEFAULT_BAR_FORMAT;
      } else if (type === ProgressType.Loading) {
        format = DEFAULT_LOADING_FORMAT;
      }
    }
    return format;
  }

  private static initProgressBarOptions(
    type: ProgressType,
    options: ProgressBarOptions,
  ): ProgressBarOptions {
    if (!options.width) {
      options.width = 30;
    }
    if (!options.complete) {
      if (type === ProgressType.Loading) {
        options.complete = green('█');
      } else {
        options.complete = green('█');
      }
    }

    if (!options.incomplete) {
      if (type === ProgressType.Loading) {
        options.incomplete = '░';
      } else {
        options.incomplete = white('░');
      }
    }
    if (!options.clear) {
      options.clear = true;
    }
    return options;
  }

  /**
   * update progress status
   * @param currentTransferred, when progress type is bar, increase progress ticks with
   */
  update(currentTransferred?: number): void {
    if (this.progressType === ProgressType.Bar) {
      if (!currentTransferred) {
        // warning, update bar with empty transferred tick.
        return;
      }
      this.updateBarType(currentTransferred);
    } else if (this.progressType === ProgressType.Loading) {
      this.updateLoadingType();
    }
  }

  updateBarType(currentTransferred: number): void {
    const increment = currentTransferred - this.bar.curr;
    this.bar.tick(increment);
  }

  updateLoadingType(): void {
    if (!this.backward && this.bar.curr === this.bar.total) {
      this.backward = true;
    } else if (this.backward && this.bar.curr === 0) {
      this.backward = false;
    }
    if (this.backward) {
      this.bar.tick(0);
    } else {
      this.bar.tick(0);
    }
  }

  terminate(): void {
    this.bar.terminate();
  }

  complete(): boolean {
    return this.bar.complete;
  }

  curr(): number {
    return this.bar.curr;
  }

  total(): number {
    return this.bar.total;
  }

  /**
   * "interrupt" the progress bar and write a message above it.
   */
  interrupt(message: string): void {
    this.bar.interrupt(message);
  }
}
