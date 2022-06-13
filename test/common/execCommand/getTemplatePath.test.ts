import {getTemplatePath, getYamlContent, transforYamlPath} from "../../../src";
import fs from "fs-extra";
import * as path from "path";

describe("getTemplatePath", () => {

  it("should throws error when s.yaml and s.yml not found", (done) => {
    getTemplatePath()
      .then(() => done("then() should not be triggered"))
      .catch(e => {
        let message = JSON.parse(e.message);
        expect(message.message).toBeDefined();
        expect(message.tips).toBeDefined();
        done();
      });
  });

  it("should prefer s.yaml in cwd", async () => {
    fs.ensureFileSync("s.yaml");
    fs.ensureFileSync("s.yml");

    let s = await getTemplatePath();
    expect(s.endsWith("yaml")).toBeTruthy();

    fs.removeSync("s.yaml");
    fs.removeSync("s.yml");
  })

  it("should return s.yml", async () => {
    fs.ensureFileSync("s.yml");

    let s = await getTemplatePath();
    expect(s.endsWith("yml")).toBeTruthy();

    fs.removeSync("s.yml");
  });
});

describe("transforYamlPath", () => {
  let s: string;
  let sProd: string;
  let workspace = "./tmp/transforYamlPath/";

  beforeEach(() => {
    s = workspace + "s.yaml";
    fs.ensureFileSync(s);
    sProd = workspace + "s-prod.yaml";
    fs.ensureFileSync(sProd);
  });

  afterEach(function () {
    fs.removeSync(workspace);
  });

  it("should invoke checkYaml() when 'extends' and 'extend' properties not exists", async () => {
    fs.writeFileSync(s, "services:");
    try {
      await transforYamlPath(s);
    } catch (e) {
      let msg = JSON.parse(e.message);
      let message: string = msg.message;
      expect(message.includes("The edition field")).toBeTruthy();
    }
  });

  it("should generate .s/s-prod.yaml when transform s-prod.yaml with extend using relative path according to cwd", async () => {
    fs.writeFileSync(s, "services:");

    let cwd = process.cwd();
    let relativePathFromCwd = path.relative(cwd, s);
    let sProdContent = "extend: " + relativePathFromCwd + "\r\n" +
      "services:";
    fs.writeFileSync(sProd, sProdContent);

    try {
      await transforYamlPath(sProd);
    } catch (e) {
      let msg = JSON.parse(e.message);
      let message: string = msg.message;
      expect(message.includes("The edition field")).toBeTruthy();
    }

    let dotSProdYaml = workspace + ".s/s-prod.yaml";
    let dotSProdYamlContent = await getYamlContent(dotSProdYaml);
    expect(dotSProdYamlContent).toStrictEqual({services: null});
  });
});
