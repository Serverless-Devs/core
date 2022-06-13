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
  let dotSProdYaml: string;
  let workspace = "./tmp/transforYamlPath/";

  beforeEach(() => {
    s = workspace + "s.yaml";
    fs.ensureFileSync(s);
    fs.writeFileSync(s, "services:");

    sProd = workspace + "s-prod.yaml";
    fs.ensureFileSync(sProd);

    dotSProdYaml = workspace + ".s/s-prod.yaml";
  });

  afterEach(function () {
    fs.removeSync(workspace);
  });

  it("should invoke checkYaml() when 'extends' and 'extend' properties not exists", async () => {
    try {
      await transforYamlPath(s);
    } catch (e) {
      let msg = JSON.parse(e.message);
      let message: string = msg.message;
      expect(message.includes("The edition field")).toBeTruthy();
    }
  });

  describe("transforming s-prod.yaml", () => {

    it("should works when extend with relative path according to cwd", async () => {
      let cwd = process.cwd();
      let relativePath = path.relative(cwd, s);
      await withoutVars(relativePath);
    });

    it("should works when having vars and extend with relative path according to cwd", async () => {
      let cwd = process.cwd();
      let relativePath = path.relative(cwd, s);
      await withVars(relativePath);
    });

    async function withoutVars(relativePath: string) {
      let sProdContent = "extend: " + relativePath + "\r\n" +
        "services:";
      fs.writeFileSync(sProd, sProdContent);

      try {
        await transforYamlPath(sProd);
      } catch (e) {
        let msg = JSON.parse(e.message);
        let message: string = msg.message;
        expect(message.includes("The edition field")).toBeTruthy();
      }

      expect(await getYamlContent(dotSProdYaml)).toStrictEqual({services: null});
    }

    async function withVars(relativePath: string) {
      let sProdContent = "extend: " + relativePath + "\r\n" +
        "vars:\r\n" +
        "services:";
      fs.writeFileSync(sProd, sProdContent);

      try {
        await transforYamlPath(sProd);
      } catch (e) {
        let msg = JSON.parse(e.message);
        let message: string = msg.message;
        expect(message.includes("The edition field")).toBeTruthy();
      }

      expect(await getYamlContent(dotSProdYaml)).toStrictEqual({
        services: null,
        vars: null
      });
    }

  });
});
