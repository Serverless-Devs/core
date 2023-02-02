class FC {
  deploy(inputs) {
    // console.log(`FC deploy: ${JSON.stringify(inputs, null, 2)}`);
    // throw new Error("deploy error");
    console.log("FC deploy");
    return { message: "this is a local fc" };
  }
  test(inputs) {
    // throw new Error("test error");
    return { test: "test111" };
  }
}

module.exports = FC;
