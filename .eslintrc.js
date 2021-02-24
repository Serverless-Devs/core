module.exports = {
  extends: 'eslint-config-ali/typescript',
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "@typescript/no-require-imports": 0
  }
};
