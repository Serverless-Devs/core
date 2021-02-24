import * as config from './handler-set-config';
const { I18n } = require('i18n');
const path = require('path');

const i18n = new I18n();

i18n.configure({
  locales: ['en', 'zh'],
  directory: path.join(__dirname, '/locales'),
});

const locale = config.getConfig('locale');
if (locale) {
  i18n.setLocale(locale);
} else {
  i18n.setLocale('en');
}

export default i18n;
