/**
 * UI strings. All user-facing copy that appears in shared chrome goes through here so a Kiswahili
 * (`sw`) map can be added without refactoring components (DESIGN.md section 10).
 * Landing sections still hold their long-form marketing copy inline; move it here when `sw` is confirmed.
 */
export type Locale = 'en' | 'sw';

export const STRINGS = {
  en: {
    skipToContent: 'Skip to content',
    offline: 'You seem offline. Pepea will reconnect when your signal returns.',
    notFoundTitle: 'This page did not make the crossing.',
    notFoundBody: 'The link may be wrong or the page may have moved.',
    goHome: 'Back to Pepea',
    errorTitle: 'Something went wrong on our side.',
    errorBody: 'Nothing you typed was lost. Try again, or dial the code on any phone.',
    tryAgain: 'Try again',
  },
  sw: {
    skipToContent: 'Ruka hadi maudhui',
    offline: 'Inaonekana huna mtandao. Pepea itaunganika tena mtandao ukirudi.',
    notFoundTitle: 'Ukurasa huu haukuvuka bahari.',
    notFoundBody: 'Kiungo kinaweza kuwa si sahihi au ukurasa umehamishwa.',
    goHome: 'Rudi Pepea',
    errorTitle: 'Kuna hitilafu upande wetu.',
    errorBody: 'Hakuna ulichoandika kilichopotea. Jaribu tena, au piga msimbo kwenye simu yoyote.',
    tryAgain: 'Jaribu tena',
  },
} as const;

export const DEFAULT_LOCALE: Locale = 'en';

export function t(key: keyof (typeof STRINGS)['en'], locale: Locale = DEFAULT_LOCALE): string {
  return STRINGS[locale][key];
}
