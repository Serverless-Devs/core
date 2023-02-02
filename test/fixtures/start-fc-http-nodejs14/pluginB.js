module.exports = async function index(inputs, args) {
  console.log(JSON.stringify(inputs, null, 2));
  process.exit(1);
  return {
    ...inputs,
    A: "B",
  };
};
