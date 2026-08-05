import type { Metadata } from 'next';
import { getLocale } from '@/lib/locale';
import { dir, t } from '@/lib/i18n';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { LabelOverridesProvider } from '@/components/LabelOverridesProvider';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import { LoadingProvider } from '@/components/LoadingOverlay';
import './globals.css';

export const metadata: Metadata = {
  title: 'RealEstate Inspect',
  description: 'Real estate inspection system'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const overrides = await loadLabelOverrides();
  const locale = await getLocale();

  return (
    <html lang={locale} dir={dir(locale)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <title>{t('app_name', locale)}</title>
      </head>
      <body className={locale === 'ar' ? 'is-rtl' : ''}>
        <LabelOverridesProvider overrides={overrides}>
          <LoadingProvider locale={locale}>
            <ConfirmProvider locale={locale}>{children}</ConfirmProvider>
          </LoadingProvider>
        </LabelOverridesProvider>
      </body>
    </html>
  );
}
