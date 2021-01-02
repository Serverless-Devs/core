/** @format */

const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

interface Profile {
    [key: string]: any;
}

function getProfileFile(): Profile {
    const profileFilePath = getDefaultProfilePath();
    if (!fs.existsSync(profileFilePath)) {
        return {};
    }
    try {
        return yaml.safeLoad(fs.readFileSync(profileFilePath, 'utf8')) || {};
    } catch (e) {
        throw e;
    }
}

function getDefaultProfilePath(): string {
    return path.join(os.homedir(), '.s', 'set-config.yml');
}

function getConfig(key: string): any {
    const profile = getProfileFile();
    return profile[key];
}

export function message(source: any): any{
    const messageList: any = {
        'Installing dependencies in serverless-devs core ...': "正在通过 Serverless-Devs Core 安装依赖 ...",
        'Please select an access:': "请选择一个账号",
    }
    const lang = getConfig("locale") || "en"
    if(lang=="en"){
        return source
    }else{
        return messageList(source)
    }

}