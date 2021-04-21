module.exports = {
  extends: 'eslint-config-ali/typescript',
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "no-console": 0,
    "@typescript/no-require-imports": 0
  }
};
