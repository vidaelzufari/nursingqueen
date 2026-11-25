import { createInstance } from 'i18next';
import en from '@/i18n/locales/en.json';
import fr from '@/i18n/locales/fr.json';
import ar from '@/i18n/locales/ar.json';
import { formatAge } from '@/i18n/formatAge';
import { computeAge } from '@/domain/dateMath';
const i18n=createInstance();
beforeAll(async()=>{await i18n.init({resources:{en:{translation:en},fr:{translation:fr},ar:{translation:ar}},lng:'fr',fallbackLng:'en',compatibilityJSON:'v4'});});
it.each(['fr','en','ar'])('formats calendar age with translated months and days in %s', async language => {
  await i18n.changeLanguage(language);
  const text=formatAge(computeAge(new Date(2026,5,4),new Date(2026,10,25)),i18n.t.bind(i18n));
  expect(text).not.toContain('profile.age');expect(text).toContain('5');expect(text).toContain('21');
});
it('uses singular month and day in English', async()=>{
  await i18n.changeLanguage('en');
  expect(formatAge(computeAge(new Date(2026,0,1),new Date(2026,1,2)),i18n.t.bind(i18n))).toBe('1 month and 1 day');
});
