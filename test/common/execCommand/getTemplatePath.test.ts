import {getTemplatePath} from "../../../src";

describe("getTemplatePath", () => {

  it("should throws error when s.yaml and s.yml not found", (done) => {
    getTemplatePath()
      .then(() => done("then() should not be triggered"))
      .catch(e=>{
        let message = JSON.parse(e.message);
        expect(message.message).toBeDefined();
        expect(message.tips).toBeDefined();
        done();
      });
  });
});
