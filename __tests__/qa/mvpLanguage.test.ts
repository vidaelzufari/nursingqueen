jest.mock('@/config/release', () => ({ MULTILINGUAL_ENABLED: false }));

it('uses English for the MVP even with a previously saved Arabic or French preference', () => {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: i18n, initI18n, resolveDeviceLanguage } = require('@/i18n');
    expect(resolveDeviceLanguage()).toBe('en');
    for (const preference of ['ar', 'fr', undefined]) {
      initI18n(preference);
      expect(i18n.language).toBe('en');
      expect(i18n.t('sleep.stop')).toBe('Stop sleep');
      expect(i18n.t('profile.age.monthPart', { count: 5 })).toBe('5 months');
    }
  });
});
