
const path = require('path');
const os = require('os');
import axios from 'axios';
import * as download from 'download';
import * as fs from 'fs-extra';
// eslint-disable-next-line no-unused-vars
import {ProgressService, ProgressType, ProgressBarOptions} from '@serverless-devs/s-progress-bar';
const got = require('got');
import {green} from 'colors';

export const SERVERLESS_API = 'https://tool.serverlessfans.com/api';

export interface RepoTemplate {
  zipFile: string;
  subPath?: string;
  hasSubPath: boolean;
}
export interface VersionCheckParams {
  name: string;
  type: any;
  provider: string;
}
export const SERVERLESS_GET_APP_INFO_URL = SERVERLESS_API + '/package/get/object/url';
export const SERVERLESS_GET_APP_VERSION = SERVERLESS_API + '/package/object/version';
export function generateId() {
  return Date.now();
}


export function readJsonFile(filePath: string) {
  let result = {};
  const data = fs.readFileSync(filePath, 'utf8');
  try {
    result = JSON.parse(data);
  } catch (e) {

  }
  return result;
}

export function writeJsonFile(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function downComponent(componentName: string, provider: any, outdir: any) {

  await fs.ensureDir(outdir);
  const componentDownUrl:any = await getPackageDownloadUrl(componentName, provider);

  if (componentDownUrl) {
    await downloadTemplateByUrl({ zipFile: componentDownUrl, hasSubPath: false }, outdir);
  }
}

export async function getRemoteComponentVersion({
  name,
  provider,
  type
}: VersionCheckParams) {
  const url = SERVERLESS_GET_APP_VERSION;
  let version = null;
  try {
    const result: any = await axios.get(url, {
      params: {
        name,
        provider,
        type: 'component'
      }
    });
    if (result.data && result.data.Response && result.data.Response.Version) {
      version = result.data.Response.Version;
    } else {
      throw new Error('Please Check the provider and component');
    }
  } catch (e) {
    return null;
  }
  return version;
}

export async function getPackageDownloadUrl(
  componentName: string, provider: string): Promise<string> {
  const options = {
    url: SERVERLESS_GET_APP_INFO_URL,
    type: 'get',
    timeout: 5000,
    headers: {},
    params: {
      name: componentName,
      provider,
      type: 'Component'
    }
  };
  const result = await axios.request(options);
  if (result.status !== 200) {
    return '';
  }
  if (!result.data.Response) {
    return '';
  }
  return new Promise((resolve, reject) => {
    resolve(result.data.Response.Url);
  });
}

export async function proxyDownload(url: string, dest: string, options: any) {
  // logger.info('prepare downloading');
  let len;
  try {
    const {headers} = await got(url, {method: 'HEAD'});
    len = parseInt(headers['content-length'], 10);
  } catch (err) {
    // ignore error
  }

  let bar :ProgressService;
  if (len) {
    let pbo :ProgressBarOptions = {
      total: len
    };
    bar = new ProgressService(ProgressType.Bar, pbo);
  } else {
    let pbo :ProgressBarOptions = {
      total: 100,
      width: 30
    };
    let format = `${green(':loading')} ${green('Downloading dependencies ... ')} `;
    bar = new ProgressService(ProgressType.Loading, pbo, format);
  }

  await download(url, dest, options).on(
    'downloadProgress', progress => {
      bar.update(progress.transferred);
    });
  // clear progress bar
  bar.terminate();
}

export async function downloadTemplateByUrl(template: RepoTemplate, outputDir: string) {
  const uuid = Date.now();
  const srcDirName = path.join(os.tmpdir(), `${uuid}`);
  try {
    await proxyDownload(template.zipFile, srcDirName, { extract: true, strip: 1 });
  } catch (err) {

  }

  if (!template.hasSubPath) {
    fs.copySync(srcDirName, outputDir, { dereference: true });
  } else {
    const srcSubDirName = path.join(srcDirName, template.subPath || '');
    const destSubDirName = path.join(outputDir, template.subPath || '');
    fs.copySync(srcSubDirName, destSubDirName, { dereference: true });
  }
}