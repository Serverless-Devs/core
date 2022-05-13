import { modifyYaml } from "../../../src";
import fs from 'fs-extra';


const newJson = {
  "edition": "1.0.0",
  "name": "hello-world-app-new",
  "access": "sub",
  "vars": {
    "region": "cn-hangzhou",
    "service": {
      "name": "hello-world-service-new",
      "description": "hello world by serverless devs"
    },
    "methods": [
      "GET",
      "POST",
      "head"
    ],
  },
  "services": {
    "helloworld": {
      "component": "fc",
      "props": {
        "region": "${vars.region}",
        "service": "${vars.service}",
        "function": {
          "name": "http-trigger-nodejs12-new",
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
            "type": "timer",
            "config": {
              "authType": "anonymous",
              "methods": "${vars.methods}"
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
                  "${vars.methods2}"
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