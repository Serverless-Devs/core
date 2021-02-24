module.exports = {
  extends: ['ali'],
  ignores: [
    (message) => message.includes('Publish'),
  ],
};
