import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommonTranslations from "../../locales/en/common.json";
import plCommonTranslations from "../../locales/pl/common.json";
import afCommonTranslations from "../../locales/af/common.json";
import trCommonTranslations from "../../locales/tr/common.json";
import cnCommonTranslations from "../../locales/cn/common.json";
import hiCommonTranslations from "../../locales/hi/common.json";
import idCommonTranslations from "../../locales/id/common.json";
import jaCommonTranslations from "../../locales/ja/common.json";
import koCommonTranslations from "../../locales/ko/common.json";
import ruCommonTranslations from "../../locales/ru/common.json";
import frCommonTranslations from "../../locales/fr/common.json";
import deCommonTranslations from "../../locales/de/common.json";
import viCommonTranslations from "../../locales/vi/common.json";

export enum Language {
  EN = "en",
  PL = "pl",
  AF = "af",
  TR = "tr",
  CN = "cn",
  HI = "hi",
  ID = "id",
  JA = "ja",
  KO = "ko",
  RU = "ru",
  FR = "fr",
  DE = "de",
  VI = "vi",
}

// System can have various regional variations for language codes, so we resolve them
export const resolveI18nLanguage = (languageCode: string): Language => {
  switch (languageCode) {
    case "en":
    case "en-AU":
    case "en-BZ":
    case "en-CA":
    case "en-CB":
    case "en-GB":
    case "en-IE":
    case "en-JM":
    case "en-NZ":
    case "en-PH":
    case "en-TT":
    case "en-US":
    case "en-ZA":
    case "en-ZW":
      return Language.EN;
    case "pl":
    case "pl-PL":
      return Language.PL;
    case "af":
    case "af-ZA":
      return Language.AF;
    case "tr":
    case "tr-TR":
      return Language.TR;
    case "cn":
    case "zh":
    case "zh-CN":
    case "zh-HK":
    case "zh-MO":
    case "zh-SG":
    case "zh-TW":
      return Language.CN; // Map to 'cn' folder
    case "hi":
    case "hi-IN":
      return Language.HI;
    case "id":
    case "id-ID":
      return Language.ID;
    case "ja":
    case "ja-JP":
      return Language.JA;
    case "ko":
    case "ko-KR":
      return Language.KO;
    case "ru":
    case "ru-RU":
      return Language.RU;
    case "fr":
    case "fr-BE":
    case "fr-CA":
    case "fr-CH":
    case "fr-FR":
    case "fr-LU":
    case "fr-MC":
      return Language.FR;
    case "de":
    case "de-AT":
    case "de-CH":
    case "de-DE":
    case "de-LI":
    case "de-LU":
      return Language.DE;
    case "vi":
    case "vi-VN":
      return Language.VI;
    default:
      return Language.EN;
  }
};

// Language names for display
export const LanguageList: Record<Language, string> = {
  [Language.EN]: "English",
  [Language.PL]: "Polski",
  [Language.AF]: "Afrikaans",
  [Language.TR]: "Türkçe",
  [Language.CN]: "简体中文", // Simplified Chinese
  [Language.HI]: "हिन्दी", // Hindi
  [Language.ID]: "Bahasa Indonesia",
  [Language.JA]: "日本語", // Japanese
  [Language.KO]: "한국어", // Korean
  [Language.RU]: "Русский", // Russian
  [Language.FR]: "Français", // French
  [Language.DE]: "Deutsch", // German
  [Language.VI]: "Tiếng Việt", // Vietnamese
};

i18n
  .use(initReactI18next)
  .init({
    lng: Language.EN,
    compatibilityJSON: "v4",
    fallbackLng: Language.EN,
    fallbackNS: "common",
    resources: {
      en: {
        common: enCommonTranslations,
      },
      pl: {
        common: plCommonTranslations,
      },
      af: {
        common: afCommonTranslations,
      },
      tr: {
        common: trCommonTranslations,
      },
      cn: {
        common: cnCommonTranslations,
      },
      hi: {
        common: hiCommonTranslations,
      },
      id: {
        common: idCommonTranslations,
      },
      ja: {
        common: jaCommonTranslations,
      },
      ko: {
        common: koCommonTranslations,
      },
      ru: {
        common: ruCommonTranslations,
      },
      fr: {
        common: frCommonTranslations,
      },
      de: {
        common: deCommonTranslations,
      },
      vi: {
        common: viCommonTranslations,
      },
    },
    supportedLngs: [
      Language.EN,
      Language.PL,
      Language.AF,
      Language.TR,
      Language.CN,
      Language.HI,
      Language.ID,
      Language.JA,
      Language.KO,
      Language.RU,
      Language.FR,
      Language.DE,
      Language.VI,
    ],
    saveMissingTo: "all",
    contextSeparator: "-",
  })
  .catch(console.log);

export default i18n;
