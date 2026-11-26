import ar from '@/i18n/locales/ar.json';

// The normal Node test runtime has PluralRules; the supported Hermes runtime may not.
it('initializes the real translation bootstrap without native PluralRules', () => {
  const original = Intl.PluralRules;
  try {
    Object.defineProperty(Intl, 'PluralRules', { configurable: true, writable: true, value: undefined });
    jest.isolateModules(() => {
      // Isolate bootstrap after removing the runtime capability, rather than testing Node's Intl.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { default: i18n, initI18n } = require('@/i18n');
      initI18n('en');
      expect(typeof Intl.PluralRules).toBe('function');
      expect(i18n.t('profile.age.monthPart', { count: 5 })).toBe('5 months');
      expect(i18n.t('profile.age.dayPart', { count: 1 })).toBe('1 day');
      initI18n('fr');
      expect(i18n.t('profile.age.dayPart', { count: 21 })).toBe('21 jours');
      initI18n('ar');
      for (const [count, form] of [[0,'zero'],[1,'one'],[2,'two'],[3,'few'],[11,'many'],[100,'other']] as const) {
        expect(i18n.t('profile.age.dayPart', { count })).toBe(ar.profile.age[`dayPart_${form}`].replace('{{count}}', String(count)));
      }
      for (const language of ['fr','en','ar']) {
        initI18n(language);
        expect(i18n.t('profile.age.monthPart', { count: 5 })).not.toContain('profile.age');
        expect(i18n.t('solids.spoonValue', { count: 3 })).not.toContain('solids.');
      }
    });
  } finally { Object.defineProperty(Intl, 'PluralRules', { configurable: true, writable: true, value: original }); }
});
