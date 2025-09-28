import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';

const LOCALES = ['en', 'vi'];

export default async function LocaleLayout(props: { children: React.ReactNode, params: { locale: string } }) {
  const { children, params } = props;
  const locale = (await Promise.resolve(params)).locale;
  let messages;
  let selectedLocale = locale;
  if (!LOCALES.includes(locale)) {
    selectedLocale = 'en';
  }
  try {
    messages = (await import(`../../messages/${selectedLocale}.json`)).default;
  } catch (error) {
    // fallback về en nếu file messages không tồn tại
    try {
      messages = (await import(`../../messages/en.json`)).default;
      selectedLocale = 'en';
    } catch (e) {
      notFound();
    }
  }
  return (
    <html lang={selectedLocale}>
      <body>
        <NextIntlClientProvider locale={selectedLocale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}