import * as config from '../libs/i18n/handler-set-config';
const { I18n } = require('i18n');

const i18n = new I18n();

i18n.configure({
  locales: ['en', 'zh'],
});

const locale = config.getConfig('locale');
if (locale) {
  i18n.setLocale(locale);
} else {
  i18n.setLocale('en');
}

export default i18n;
