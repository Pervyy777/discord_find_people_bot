const path = require('path');
const fs = require('fs');
const Photo = require('../models/photo'); // Путь к модели Photo

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
                console.error(`File not found: ${photoPath}`);
            }
        } else {
            console.error(`Photo not found in database: ${photo}`);
        }
    }
    return files;
}

module.exports = fetchPhotoFiles;
