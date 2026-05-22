import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import fr from "./locales/fr";

const saved = localStorage.getItem("lang");
const browser = navigator.language.startsWith("fr") ? "fr" : "en";
const lng = saved ?? browser;

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    lng,
    fallbackLng: "en",
    defaultNS: "translation",
    interpolation: { escapeValue: false },
  });

export default i18n;