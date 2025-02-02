const {ComponentType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const FIND_CITY = require('../utils/findCity');
const log = require('../utils/debugLog');
const User = require("../models/user");
const PromoCode = require("../models/promoCode");
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const Photo = require('../models/photo');
const Profile = require('../models/profile');
const { v4: uuidv4 } = require('uuid');
const language = require('../utils/language');
const PROFILE = require("../utils/profile");

async function createUser(userDetails) {
    try {
        // Create a new user instance with the provided details
        const newUser = new User(userDetails);

        // Save the new user to the database
        await newUser.save();

        log("i", 'User created successfully:', newUser);
        return newUser;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error; // Re-throw the error for further handling if needed
    }
}

async function ancetFillModal(interaction) {
    const promoCode = interaction.customId.split('_')[2];
    const lang = interaction.locale; 
      // Create the modal
      const modal = new ModalBuilder()
          .setCustomId(`ancet_datafill_${promoCode}`)
          .setTitle(language.getLocalizedString(lang, 'modalTitle'));

      // Add components to modal
      const nameInput = new TextInputBuilder()
          .setCustomId('nameInput')
          .setLabel(language.getLocalizedString(lang, 'nameLabel'))
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

      const ageInput = new TextInputBuilder()
          .setCustomId('ageInput')
          .setLabel(language.getLocalizedString(lang, 'ageLabel'))
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

      const cityInput = new TextInputBuilder()
          .setCustomId('cityInput')
          .setLabel(language.getLocalizedString(lang, 'cityLabel'))
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

      const descriptionInput = new TextInputBuilder()
          .setCustomId('descriptionInput')
          .setLabel(language.getLocalizedString(lang, 'descriptionLabel'))
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false);

    // An action row only holds one text input,
    const actionRow1 = new ActionRowBuilder().addComponents(nameInput);
    const actionRow2 = new ActionRowBuilder().addComponents(ageInput);
    const actionRow3 = new ActionRowBuilder().addComponents(cityInput);
    const actionRow4 = new ActionRowBuilder().addComponents(descriptionInput);

    // Add inputs to the modal
    modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4);

    // Show the modal to the user
    await interaction.showModal(modal);
}
// Функция для проверки наличия ссылок в тексте
function containsURL(text) {
    const urlRegex = /(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-zA-Z0-9а-яА-ЯёЁ]+(\.[a-zA-Zа-яА-ЯёЁ]{2,})+(\S*)?/;
    return urlRegex.test(text);
}

// Функция для проверки наличия запрещённых слов в тексте
function containsForbiddenWords(text) {
    const lowercasedText = text.toLowerCase(); // Переводим текст в нижний регистр для учёта регистронезависимости

    // Загружаем список запрещённых слов из JSON файла
    const forbiddenWordsPath = path.join(__dirname, '../models/blackWords.json');
    const forbiddenWords = JSON.parse(fs.readFileSync(forbiddenWordsPath, 'utf8'));

    // Проверяем наличие запрещённых слов в тексте
    return forbiddenWords.some(word => lowercasedText.includes(word));
}

async function ancetFillGender(interaction) {
    const promoCode = interaction.customId.split('_')[2];
    const lang = interaction.locale; 
    // Retrieve input values from the modal
    const name = interaction.fields.getTextInputValue('nameInput');
    const age = interaction.fields.getTextInputValue('ageInput');
    const city = interaction.fields.getTextInputValue('cityInput');
    const description = interaction.fields.getTextInputValue('descriptionInput');

     // Validate inputs
     if (!name || !age || !city) {
        return interaction.reply({ content: language.getLocalizedString(lang, 'allFieldsRequired'), ephemeral: true });
      }

      if (isNaN(age) || age <= 2) {
        return interaction.reply({ content: language.getLocalizedString(lang, 'invalidAge'), ephemeral: true });
      }

      // Проверка на наличие ссылок или запрещённых слов в тексте и отправка соответствующего сообщения
      if (containsURL(name) || containsURL(description) || containsForbiddenWords(name) || containsForbiddenWords(description) || containsForbiddenWords(city) || containsURL(city)) {
        return interaction.reply({ content: language.getLocalizedString(lang, 'contentNotAllowed'), ephemeral: true });
      }

      const embedReply = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(language.getLocalizedString(lang, 'formTitle'))
        .setDescription(language.getLocalizedString(lang, 'selectGender'));

      const male = new ButtonBuilder()
        .setCustomId('ancet_genderfill_male')
        .setLabel(language.getLocalizedString(lang, 'male'))
        .setStyle(ButtonStyle.Secondary);

      const female = new ButtonBuilder()
        .setCustomId('ancet_genderfill_female')
        .setLabel(language.getLocalizedString(lang, 'female'))
        .setStyle(ButtonStyle.Secondary);

    const choseRow = new ActionRowBuilder().addComponents(male, female);

    const channel = interaction.channel;
    await interaction.deferUpdate();
    await interaction.message.edit({embeds: [embedReply], components: [choseRow], files: [] }).then((message) => {
        const sentMsg = message; // Теперь sentMsg - это объект Message

        const filter = (i) => i.customId.startsWith('ancet_genderfill_') && i.user.id === interaction.user.id && interaction.message.id === i.message.id ;

        const timeoutId = setTimeout(async () => {
            // Пройдитесь по каждому компоненту в choiceRow и отключите его
            choseRow.components.forEach((component) => {
                component.setDisabled(true);
            });

            // Обновите исходное сообщение с отключенными компонентами
            await sentMsg.edit({ components: [choseRow] });
            log("i",'Таймер завершен!');
        }, 3 * 60 * 1000);

        const collector = channel.createMessageComponentCollector({ filter, time: 3 * 60 * 1000, componentType: ComponentType.Button });
        collector.on('collect', async (interaction) => {
            log("i",`Собрано ${interaction.customId}`);
            clearTimeout(timeoutId); // Очистите таймаут с использованием идентификатора таймаута
            // Проверка, является ли пользователь, взаимодействующий с кнопками, тем же самым отправителем
            if (interaction.isButton()) {
                if (interaction.user.id !== interaction.message.interaction.user.id) {
                    return interaction.reply({ content: language.getLocalizedString(lang, 'notSender'), ephemeral: true });
                }

                    return ancetFillInterestingGender(interaction, name, age,city, description, promoCode);
            }
        });
        collector.on('end', collected => log("i",`Собрано ${collected.size} элементов`));
    });
}

async function ancetFillInterestingGender(interaction, name, age, city, description, promoCode) {
    const gender = interaction.customId.split('_')[2];
    const lang = interaction.locale; 

    const embedReply = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(language.getLocalizedString(lang, 'formTitle'))
        .setDescription(language.getLocalizedString(lang, 'selectWhoToFind'));

    const male = new ButtonBuilder()
        .setCustomId(`ancet_interestinggenderfill_male`)
        .setLabel(language.getLocalizedString(lang, 'male'))
        .setStyle(ButtonStyle.Secondary);

    const female = new ButtonBuilder()
        .setCustomId(`ancet_interestinggenderfill_female`)
        .setLabel(language.getLocalizedString(lang, 'female'))
        .setStyle(ButtonStyle.Secondary);

    const other = new ButtonBuilder()
        .setCustomId(`ancet_interestinggenderfill_other`)
        .setLabel(language.getLocalizedString(lang, 'doesNotMatter'))
        .setStyle(ButtonStyle.Secondary);

    const choseRow = new ActionRowBuilder().addComponents(male, female, other);

    const channel = interaction.channel;
    await interaction.deferUpdate();
    await interaction.message.edit({embeds: [embedReply], components: [choseRow] }).then((message) => {
        const sentMsg = message; // Теперь sentMsg - это объект Message

        const filter = (i) => i.customId.startsWith('ancet_interestinggenderfill_') && i.user.id === interaction.user.id && interaction.message.id === i.message.id ;

        const timeoutId = setTimeout(async () => {
            // Пройдитесь по каждому компоненту в choiceRow и отключите его
            choseRow.components.forEach((component) => {
                component.setDisabled(true);
            });

            // Обновите исходное сообщение с отключенными компонентами
            await sentMsg.edit({ components: [choseRow] });
            log("i",'Таймер завершен!');
        }, 3 * 60 * 1000);

        const collector = channel.createMessageComponentCollector({ filter, time: 3 * 60 * 1000, componentType: ComponentType.Button });
        collector.on('collect', async (interaction) => {
            console.log(`Собрано ${interaction.customId}`);
            clearTimeout(timeoutId); // Очистите таймаут с использованием идентификатора таймаута
            // Проверка, является ли пользователь, взаимодействующий с кнопками, тем же самым отправителем
            if (interaction.isButton()) {
                if (interaction.user.id !== interaction.message.interaction.user.id) {
                    return interaction.reply({ content: language.getLocalizedString(lang, 'notSender'), ephemeral: true });
                }

                return ancetSaveData(interaction, name, age, city, description, gender, promoCode);
            }
        });
        collector.on('end', collected => log("i",`Собрано ${collected.size} элементов`));
    });
}

// Function to generate a random promo code
function generatePromoCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  
  // Function to generate a unique promo code
  async function generateUniquePromoCode(length) {
    let promoCode;
    let isUnique = false;
  
    while (!isUnique) {
      promoCode = generatePromoCode(length);
      const existingCode = await PromoCode.findOne({ code: promoCode });
      if (!existingCode) {
        isUnique = true;
      }
    }
  
    return promoCode;
  }

async function ancetSaveData(interaction, name, age, city, description, gender, promoCode) {
    const cityFound = await FIND_CITY(city);
    const interestingGender = interaction.customId.split('_')[2];

    // Prepare the userDetails object based on whether the city is found or not
    const userDetails = {
        userDiscordId: interaction.user.id,
        name,
        age,
        city,
        description,
        gender,
        language: interaction.locale,
        interestingGender,
        ...(cityFound && { cityEn: cityFound.cityNameEn, country: cityFound.country }),
    };

    // Check if the user already exists in the database
    const existingUser = await User.findOne({ userDiscordId: interaction.user.id });
    if (existingUser) {

        await Profile.findByIdAndDelete(existingUser.profile)

        const newProfile = new Profile({
            user: existingUser._id,  
            age,      
            gender,
            interestingGender,
            ...(cityFound && { cityEn: cityFound.cityNameEn, country: cityFound.country }),
        })
        await newProfile.save()

        userDetails.profile = newProfile._id

        // Update the existing user's details
        Object.assign(existingUser, userDetails);
        existingUser.save().then(user => {
            log("i",'Updated user:', user);
        }).catch(error => {
            log("e", error);
        });
    } else {
        // Create a new user
        createUser(userDetails).then(async (user) => {
            const newProfile = new Profile({
                user: user._id,         
                gender,
                age,
                interestingGender,
                ...(cityFound && { cityEn: cityFound.cityNameEn, country: cityFound.country }),
            })
            await newProfile.save()

            const promoCodeString = await generateUniquePromoCode(5);
            const newPromoCode = new PromoCode({
                code: promoCodeString,
                userId: user._id,         
            })
            await newPromoCode.save()

            const promoCodeDB = await PromoCode.findOne({code: promoCode})
            if(promoCodeDB){
                await PromoCode.updateOne(
                    { _id: promoCodeDB._id },
                    { $push: { usersUsed: user._id } } // Ensure user._id is directly pushed
                );

                await User.updateOne(
                    { _id: promoCodeDB.userId },
                    { $inc: { likesTodayCount: 20, likesDayCount: 20 } }
                );
                
                 user.likesTodayCount = user.likesTodayCount + 20
                 user.likesDayCount = user.likesDayCount + 20
                
            }

            user.profile = newProfile._id;
            user.promoCode = newPromoCode._id;

            await user.save()

            log("i", 'Created user:', user);
        }).catch(error => {
            log('e', error);
        });
    }

    return ancetFillPhotos(interaction);
}

async function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

async function ancetFillPhotos(interaction) {
    const lang = interaction.locale; 
    const embedReply = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(language.getLocalizedString(lang, 'formTitle'))
        .setDescription(language.getLocalizedString(lang, 'uploadPhotosVideos'));

    const confirmButton = new ButtonBuilder()
        .setCustomId('ancet_photos_upload')
        .setLabel(language.getLocalizedString(lang, 'yes'))
        .setStyle(ButtonStyle.Secondary);

    const cancelButton = new ButtonBuilder()
        .setCustomId('ancet_photos_cancel')
        .setLabel(language.getLocalizedString(lang, 'no'))
        .setStyle(ButtonStyle.Secondary);

    const choseRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    await interaction.deferUpdate();
    await interaction.message.edit({
        embeds: [embedReply],
        components: [choseRow],
        files: []
    });
}

async function ancetFillDescription(interaction) {
    const lang = interaction.locale; 
// Create the modal
    const modal = new ModalBuilder()
        .setCustomId('ancet_descriptionfilldata')
        .setTitle(language.getLocalizedString(lang, 'modalDescriptionTitle'));

    const descriptionInput = new TextInputBuilder()
        .setCustomId('descriptionInput')
        .setLabel(language.getLocalizedString(lang, 'descriptionLabel'))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);


    const actionRow = new ActionRowBuilder().addComponents(descriptionInput);

    // Add inputs to the modal
    modal.addComponents(actionRow);

    // Show the modal to the user
    await interaction.showModal(modal);
}
async function ancetFillDescriptionData(interaction) {
    try {
        const description = interaction.fields.getTextInputValue('descriptionInput');

        await interaction.deferUpdate();

        const existingUser = await User.findOne({ userDiscordId: interaction.user.id });

        if (existingUser) {
            existingUser.description = description;
            await existingUser.save();
        } else {
            log("i",'User not found');
        }
        return PROFILE(interaction)
    } catch (error) {
        log("e", error);
    }
}
const activeCollectors = new Map();

async function ancetPhotos(i) {
    const lang = i.locale; // Changed from interaction.locale to i.locale

    if (i.customId === 'ancet_photos_upload') {
        // If there's an existing collector for this user, stop it
        if (activeCollectors.has(i.user.id)) {
            const existingCollector = activeCollectors.get(i.user.id);
            existingCollector.stop();
        }

        await i.deferUpdate();
        const uploadEmbed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(language.getLocalizedString(lang, 'uploadPhotosVideosTitle'))
            .setDescription(language.getLocalizedString(lang, 'uploadPhotosVideosDescription'));

        await i.message.edit({ embeds: [uploadEmbed], components: [] });

        const messageFilter = (m) => m.author.id === i.user.id && m.attachments.size > 0;
        const messageCollector = i.channel.createMessageCollector({ filter: messageFilter, time: 180000 });

        // Track the collector for this user
        activeCollectors.set(i.user.id, messageCollector);

        let uploadedFiles = 0;

        // Clear the user's photos array
        const userDB = await User.findOne({ userDiscordId: i.user.id });
        if (userDB) {
            await Promise.all(userDB.photos.map(async (photoId) => {
                const photoDB = await Photo.findById(photoId);
                if (photoDB) {
                    photoDB.activ = false;
                    await photoDB.save();
                }
            }));
            userDB.photos = [];
            await userDB.save();
        }

        messageCollector.on('collect', async (message) => {
            const attachments = message.attachments;

            if (uploadedFiles > 3) {
                await message.reply(language.getLocalizedString(lang, 'maxFilesUploaded'));
                return;
            }

            for (const attachment of attachments.values()) {
                if (uploadedFiles > 3) break;

                if (attachment.contentType.startsWith('image/') || (attachment.contentType.startsWith('video/') && attachment.size <= 15 * 1024 * 1024)) {
                    const fileUrl = attachment.url;
                    const uniqueFileName = uuidv4() + path.extname(attachment.name);
                    const filePath = path.join(__dirname, `../uploads/${i.user.id}`, uniqueFileName);

                    try {
                        // Check if the user already exists in the database
                        const userDB = await User.findOne({ userDiscordId: i.user.id });
                        if (!userDB) {
                            await message.reply(language.getLocalizedString(lang, 'userNotFound'));
                            return;
                        }

                        // Create and save the photo document
                        const photo = new Photo({
                            name: uniqueFileName,
                            userDiscordId: i.user.id,
                            user: userDB._id,
                        });

                        // Ensure the directory exists
                        await ensureDirectoryExists(path.join(__dirname, `../uploads/${i.user.id}`));

                        // Download and save the file
                        const response = await axios({
                            url: fileUrl,
                            method: 'GET',
                            responseType: 'stream',
                        });

                        response.data.pipe(fs.createWriteStream(filePath));
                        response.data.on('end', async () => {
                            uploadedFiles++;
                            if (uploadedFiles > 3) {
                                messageCollector.stop();
                                await i.followUp(language.getLocalizedString(lang, 'maxFilesUploaded'));
                            } else {
                                await photo.save();
                                userDB.photos.push(photo._id);
                                await userDB.save();

                                log("i", `Saved attachment: ${filePath}`);
                                
                            }
                        });

                        response.data.on('error', (err) => {
                            log("e", 'Error downloading the file:', err);
                            message.reply(language.getLocalizedString(lang, 'fileSaveError'));
                        });
                    } catch (error) {
                        log("e", 'Error fetching the file:', error);
                        await message.reply(language.getLocalizedString(lang, 'fileUploadError'));
                    }
                } else {
                    await message.reply(language.getLocalizedString(lang, 'fileRequirementsError'));
                }
            }
            await message.delete();
            await PROFILE(i)
        });

        messageCollector.on('end', (collected) => {
            activeCollectors.delete(i.user.id);
            if (collected.size === 0) {
                i.followUp(language.getLocalizedString(lang, 'fileUploadTimeout'));
            }
        });
    } else if (i.customId === 'ancet_photos_cancel') {
        await i.deferUpdate();
        // If there's an active collector for this user, stop it
        if (activeCollectors.has(i.user.id)) {
            const existingCollector = activeCollectors.get(i.user.id);
            existingCollector.stop();
            activeCollectors.delete(i.user.id);
        }
        await PROFILE(i)
    }
}

module.exports = { ancetFillModal, ancetFillGender, ancetFillPhotos, ancetFillDescription, ancetFillDescriptionData, containsForbiddenWords, ancetPhotos };