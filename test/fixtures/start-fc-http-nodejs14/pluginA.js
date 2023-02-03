module.exports = async function index(inputs, args) {
  // console.log("pluginA======", JSON.stringify(inputs), args);
  return {
    ...inputs,
    pluginA: "pluginA data",
  };
};
