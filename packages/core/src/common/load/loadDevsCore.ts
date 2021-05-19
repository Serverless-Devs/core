import fs from 'fs-extra';
import path from 'path';
import get from 'lodash.get';
import compressing from 'compressing';
import { execSync } from 'child_process';
import { S_ROOT_HOME } from '../../libs/common';
import { downloadRequest } from '../request';

const cachePath = path.join(S_ROOT_HOME, 'cache');
const corePath = path.join(cachePath, 'core');
const packagePath = path.join(corePath, 'package');

function removedevscore(componentPath){
    const package_json_path = path.join(componentPath, 'package.json');
    const oldData = fs.readFileSync(package_json_path, 'utf8');
    const newData = oldData.replace(/"@serverless-devs\/core": "^0.0.*",/g, '');
    fs.writeFileSync(package_json_path, newData)
}
function getflieName(url = ''){
    const urlArr = url.split('/');
    return get(urlArr, `[${urlArr.length-1}]`, 'core.zip');
}
function getCoreInfo(){
    const result = execSync('npm view @serverless-devs/core --json');
    const resultInfo = JSON.parse(result.toString())
    const url = resultInfo.dist.tarball;
    const fileName = getflieName(url);
    return {
        url,
        fileName
    }
}
export async function downLoadDesCore(componentPath) {
    const {url, fileName} = getCoreInfo();
    const dest = path.join(cachePath,fileName);
    const node_modules_path = path.join(packagePath, 'node_modules');
    if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
    }
    if (!fs.existsSync(corePath)){
        await downloadRequest(url, cachePath, { extract: false, strip: 1 });
        await compressing.tgz.uncompress(dest, corePath);

    }
    if(!fs.existsSync(node_modules_path) && fs.existsSync(packagePath)){
        execSync('npm link', {cwd: packagePath});
    }
    if(fs.existsSync(node_modules_path)){
        removedevscore(componentPath);
        execSync(`npm link ${packagePath}`, {cwd: componentPath});
    }
}

export async function updateDesCore(){
    const {fileName, url} = getCoreInfo();
    const newDest = path.join(cachePath, fileName);
    if (!fs.existsSync(newDest)) {
        //await fs.remove() todo 删除之前的tgz压缩包
        const node_modules_path = path.join(packagePath, 'node_modules');
        await downloadRequest(url, cachePath, { extract: false, strip: 1 });
        await compressing.tgz.uncompress(newDest, corePath);
        if(!fs.existsSync(node_modules_path) && fs.existsSync(packagePath)){
            execSync('npm link', {cwd: packagePath});
        }
    }
}

