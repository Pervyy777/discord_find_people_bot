const fs = require('fs');
const path = require('path');

function removeDuplicates(words) {
    return [...new Set(words)];
}

// Загружаем список запрещённых слов из JSON файла
const forbiddenWordsPath = path.join(__dirname, './src/models/blackWords.json');
const forbiddenWords = JSON.parse(fs.readFileSync(forbiddenWordsPath, 'utf8'));

// Удаляем дубликаты
const uniqueWords = removeDuplicates(forbiddenWords);

// Сохраняем уникальные слова в новый JSON файл
const uniqueWordsPath = path.join(__dirname, './src/models/uniqueBlackWords.json');
fs.writeFileSync(uniqueWordsPath, JSON.stringify(uniqueWords, null, 2), 'utf8');

console.log('Уникальные слова сохранены в', uniqueWordsPath);
