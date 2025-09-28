import {getRequestConfig} from 'next-intl/server';
import en from '../messages/en.json';
import vi from '../messages/vi.json';

export default getRequestConfig(async ({requestLocale}) => {
  const locale = (await requestLocale) || 'vi';
  const messages = locale === 'vi' ? vi : en;
  return {
    locale,
    locales: ['en', 'vi'],
    defaultLocale: 'vi',
    localePrefix: 'always',
    messages
  };
});