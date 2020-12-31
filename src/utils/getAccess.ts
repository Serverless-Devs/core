/** @format */

const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

export class GetManager {
    protected localPath: string = path.join(process.cwd(), '/access.yaml');
    protected globalPath: string = path.join(os.homedir(), `.s/access.yaml`);
    protected programArgsLength = 0;
    protected resUserInformation: any = {};
    protected providerAlias: string;

    constructor() {
        if (!fs.existsSync(path.join(process.cwd(), '/access.yaml'))) {
            this.localPath = path.join(process.cwd(), '/access.yml');
        }

        if (!fs.existsSync(this.globalPath)) {
            fs.writeFileSync(this.globalPath, '');
        }
    }

    async initAccessData(userInput: any) {
        await this.getManager(userInput, this.localPath);
        await this.getManager(userInput, this.globalPath);
    }

    async getManager(userInput: any, filePath: string) {
        try {
            let userInformation: any;
            try {
                userInformation = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
            } catch (ex) {
                if (filePath === this.globalPath) {
                    fs.writeFileSync(this.globalPath, '');
                }
            }
            if (userInformation !== null) {
                if (userInput.Provider) {
                    const provider: string = String(userInput.Provider).toLocaleLowerCase();
                    const userInformationKey: string[] = Object.keys(userInformation);
                    if (userInput.AliasName) {
                        const aliasName: string = String(userInput.AliasName).toLocaleLowerCase();
                        this.providerAlias = this.localPath === filePath ? aliasName : `${provider}.${aliasName}`;
                        userInformationKey.forEach(item => {
                            if (item === this.providerAlias) {
                                this.resUserInformation[this.providerAlias] = userInformation[this.providerAlias];
                            }
                        });
                    } else {
                        userInformationKey.forEach(item => {
                            if (this.localPath === filePath) {
                                this.resUserInformation[`project.${item}`] = userInformation[item];
                            } else if (item.split('.')[0] === provider) {
                                this.resUserInformation[item] = userInformation[item];
                            }
                        });
                    }
                } else if (userInput.List) {
                    for (const item in userInformation) {
                        if (filePath === this.localPath) {
                            this.resUserInformation[`project.${item}`] = userInformation[item];
                        } else {
                            this.resUserInformation[item] = userInformation[item];
                        }
                    }
                }
            } else {
                if (this.localPath !== filePath) {
                    throw Error('Query failed : User configuration is empty');
                }
            }
        } catch (ex) {
            this.resUserInformation = {};
        }
    }

    //返回单个provider.alias的值
    async getUserSecretID(userInput: any) {
        if (this.resUserInformation !== null) {
            if (userInput.Provider && userInput.AliasName) {
                return this.resUserInformation[userInput.AliasName] || this.resUserInformation[this.providerAlias];
            }
            // await this.initAccessData(userInput)
            return this.resUserInformation;
        }
        throw Error(
            'Query failed : Please input right format. You can obtain the key information through: s config get -h',
        );
    }
}
