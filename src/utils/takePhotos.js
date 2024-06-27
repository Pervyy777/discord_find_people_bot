const path = require('path');
const fs = require('fs');
const Photo = require('../models/photo'); // Путь к модели Photo
const log = require('./debugLog.js');

async function fetchPhotoFiles(userDB) {
    const files = [];
    for (const photo of userDB.photos) {
        const photoDB = await Photo.findOne({ _id: photo });

        if (photoDB) {
            const photoPath = path.join(__dirname, '..', 'uploads', photoDB.userDiscordId, photoDB.name);

            if (fs.existsSync(photoPath)) {
                files.push({
                    attachment: photoPath,
                    name: photoDB.name,
                });
            } else {
                log("w",`File not found: ${photoPath}`);
            }
        } else {
            log("w",`Photo not found in database: ${photo}`);
        }
    }
    return files;
}

module.exports = fetchPhotoFiles;
