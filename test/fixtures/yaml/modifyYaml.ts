import { modifyYaml } from "../../../src";
import fs from 'fs-extra';


const newJson = {
    "edition": "1.0.0",
    "name": "hello-world-app",
    "access": "sub",
    "vars": {
        "region": "cn-hangzhou",
        "service": {
            "name": "hello-world-service",
            "description": "hello world by serverless devs"
        },
        "methods": [
            "GET",
            "POSTx"
        ],
        "methods2": "sme"
    },
    "services": {
        "helloworld": {
            "component": "fc",
            "props": {
                "region": "cn-shanghai",
                "service": {
                    "name": "hello-new-service",
                    "description": "hello world by serverless devs"
                },
                "function": {
                    "name": "http-trigger-nodejs12",
                    "description": "hello world by serverless devs",
                    "runtime": "nodejs12",
                    "codeUri": "./code",
                    "handler": "index.handler",
                    "memorySize": 128,
                    "timeout": 60
                },
                "triggers": [
                    {
                        "name": "httpTrigger",
                        "type": "http",
                        "config": {
                            "authType": "anonymous",
                            "methods": [
                                "GET",
                                "POSTx",
                                "DElete"
                            ]
                        }
                    }
                ],
                "customDomains": [
                    {
                        "domainName": "auto",
                        "protocol": "HTTP",
                        "routeConfigs": [
                            {
                                "path": "/*",
                                "methods": [
                                    "smenew"
                                ]
                            }
                        ]
                    }
                ]
            }
        }
    }
}

const data = fs.readFileSync('yaml/s.yaml', 'utf8');


const doc = modifyYaml(newJson, data)

fs.writeFileSync('yaml/new.yaml', doc)