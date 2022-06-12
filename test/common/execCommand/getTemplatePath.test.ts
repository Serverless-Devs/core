import {getTemplatePath} from "../../../src";
import fs from "fs-extra";

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
