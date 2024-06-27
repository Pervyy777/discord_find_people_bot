const path = require('path');
const fs = require('fs');
const log = require("./debugLog")

const DEFAULT_LANGUAGE = 'en';
const LOCALES_DIR = path.join(__dirname, '..', 'locales'); // Adjust the path based on your project structure

let languages = {};

fs.readdirSync(LOCALES_DIR).forEach(file => {
  const filePath = path.join(LOCALES_DIR, file);
  const fileName = path.parse(file).name;
  languages[fileName] = require(filePath);
});

function getLocalizedString(locale, key) {
  const lang = languages[locale] || languages[DEFAULT_LANGUAGE];
  return lang[key] || log("w", `Missing ${locale} translation: ${key}`) || `Missing ${locale} translation: ${key}`;
}

module.exports = {
  getLocalizedString
};