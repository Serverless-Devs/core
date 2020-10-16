const path = require('path');
const os = require('os');
const fs = require('fs');
import { generateId, readJsonFile, writeJsonFile } from './utils';

interface ContextParams {
  stateFileRoot?: string, // load cache file dir
  componentPathRoot?: string, // load component dir
  credentials?: any
}

export default class Context {

  protected state: any;
  protected credentials = {};
  public stateFileRoot: any;
  public componentPathRoot: any;
  protected id: any;
  constructor(context: ContextParams = {}) {

    const { stateFileRoot, componentPathRoot } = context;
    const currentSDir = path.join(process.cwd(), '.s');
    this.componentPathRoot = componentPathRoot ? path.resolve(componentPathRoot) : path.join(os.homedir(), '.s', 'components');
    if (!stateFileRoot && !fs.existsSync(currentSDir)) {
      fs.mkdirSync(currentSDir);
    }
    this.stateFileRoot = stateFileRoot ? path.resolve(stateFileRoot) : currentSDir;

    this.credentials = context.credentials || {};
    this.id = generateId();
    this.state = { id: this.id };
  }

  async init() {
    const contextStatePath = path.join(this.stateFileRoot, `identify_.json`);
    if (fs.existsSync(contextStatePath)) {
      this.state = readJsonFile(contextStatePath);
    } else {
      writeJsonFile(contextStatePath, this.state);
    }
    this.id = this.state.id;
  }

  async getState(id: any) {
    const stateFilePath = path.join(this.stateFileRoot, `${id}.json`);
    let result = {};
    if (fs.existsSync(stateFilePath)) {
      result = readJsonFile(stateFilePath);
    }
    return result;
  }

  async setState(id: any, state: any) {
    const stateFilePath = path.join(this.stateFileRoot, `${id}.json`);
    if (!fs.existsSync(stateFilePath)) {
      fs.openSync(stateFilePath, 'w');
    }
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
    return state;
  }
}