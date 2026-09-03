import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always'
});

// 注意：/signin、/signup 是无 locale 的独立页面，需要排除掉 locale 中间件。
export const config = {
  matcher: ['/((?!api|_next|_vercel|auth|signin|signup|.*\\..*).*)']
};
