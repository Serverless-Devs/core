class FC {
  deploy(inputs) {
    // console.log(`FC deploy: ${JSON.stringify(inputs, null, 2)}`);
    console.log("FC deploy");
    // throw new Error("deploy error");
    return { message: "this is a local fc" };
  }
  test(inputs) {
    // throw new Error("test error");
    return { test: "test111" };
  }
}

module.exports = FC;
