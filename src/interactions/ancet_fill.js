const {ComponentType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const FIND_CITY = require('../utils/findCity');
const log = require('../utils/debugLog');
const User = require("../models/user");
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const Photo = require('../models/photo');
const Profile = require('../models/profile');

async function createUser(userDetails) {
    try {
        // Create a new user instance with the provided details
        const newUser = new User(userDetails);

        // Save the new user to the database
        await newUser.save();

        console.log('User created successfully:', newUser);
        return newUser;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error; // Re-throw the error for further handling if needed
    }
}

async function ancetFillModal(interaction) {
    // Create the modal
    const modal = new ModalBuilder()
        .setCustomId('ancet_datafill')
        .setTitle('ЗАПОЛНЕНИЕ АНКЕТЫ');

    // Add components to modal
    const nameInput = new TextInputBuilder()
        .setCustomId('nameInput')
        .setLabel("Введите ваше имя")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const ageInput = new TextInputBuilder()
        .setCustomId('ageInput')
        .setLabel("Введите ваш возраст")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const cityInput = new TextInputBuilder()
        .setCustomId('cityInput')
        .setLabel("Введите ваш город")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('descriptionInput')
        .setLabel("Расскажите про себя")
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

async function ancetFillGender(interaction) {
    // Retrieve input values from the modal
    const name = interaction.fields.getTextInputValue('nameInput');
    const age = interaction.fields.getTextInputValue('ageInput');
    const city = interaction.fields.getTextInputValue('cityInput');
    const description = interaction.fields.getTextInputValue('descriptionInput');

    // Validate inputs
    if (!name || !age || !city) {
        return interaction.reply({ content: 'Все поля обязательны для заполнения.', ephemeral: true });
    }

    if (isNaN(age) || age <= 0) {
        return interaction.reply({ content: 'Пожалуйста, введите корректный возраст.', ephemeral: true });
    }

    const embedReply = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle('Заполнение анкеты')
        .setDescription('Выберите ваш пол');

    const male = new ButtonBuilder()
        .setCustomId('ancet_genderfill_male')
        .setLabel('Мужской')
        .setStyle(ButtonStyle.Secondary);

    const female = new ButtonBuilder()
        .setCustomId('ancet_genderfill_female')
        .setLabel('Женский')
        .setStyle(ButtonStyle.Secondary);

    const other = new ButtonBuilder()
        .setCustomId('ancet_genderfill_other')
        .setLabel('Другое')
        .setStyle(ButtonStyle.Secondary);

    const choseRow = new ActionRowBuilder().addComponents(male, female, other);

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
            console.log('Таймер завершен!');
        }, 3 * 60 * 1000);

        const collector = channel.createMessageComponentCollector({ filter, time: 3 * 60 * 1000, componentType: ComponentType.Button });
        collector.on('collect', async (interaction) => {
            console.log(`Собрано ${interaction.customId}`);
            console.log(`i.message.id: ${interaction.message.id}`);
            console.log(`sentMsg.id: ${sentMsg.id}`);
            clearTimeout(timeoutId); // Очистите таймаут с использованием идентификатора таймаута
            // Проверка, является ли пользователь, взаимодействующий с кнопками, тем же самым отправителем
            if (interaction.isButton()) {
                if (interaction.user.id !== interaction.message.interaction.user.id) {
                    return interaction.reply({ content: 'Вы не отправитель этой операции.', ephemeral: true });
                }

                    return ancetFillInterestingGender(interaction, name, age,city, description);
            }
        });
        collector.on('end', collected => console.log(`Собрано ${collected.size} элементов`));
    });
}

async function ancetFillInterestingGender(interaction, name, age, city, description) {
    const gender = interaction.customId.split('_')[2];


    const embedReply = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle('Заполнение анкеты')
        .setDescription('Выберите кого хотите найти');

    const male = new ButtonBuilder()
        .setCustomId(`ancet_interestinggenderfill_${gender}_male`)
        .setLabel('Мужской')
        .setStyle(ButtonStyle.Secondary);

    const female = new ButtonBuilder()
        .setCustomId(`ancet_interestinggenderfill_${gender}_female`)
        .setLabel('Женский')
        .setStyle(ButtonStyle.Secondary);

    const other = new ButtonBuilder()
        .setCustomId(`ancet_interestinggenderfill_${gender}_other`)
        .setLabel('Другое')
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
            console.log('Таймер завершен!');
        }, 3 * 60 * 1000);

        const collector = channel.createMessageComponentCollector({ filter, time: 3 * 60 * 1000, componentType: ComponentType.Button });
        collector.on('collect', async (interaction) => {
            console.log(`Собрано ${interaction.customId}`);
            console.log(`i.message.id: ${interaction.message.id}`);
            console.log(`sentMsg.id: ${sentMsg.id}`);
            clearTimeout(timeoutId); // Очистите таймаут с использованием идентификатора таймаута
            // Проверка, является ли пользователь, взаимодействующий с кнопками, тем же самым отправителем
            if (interaction.isButton()) {
                if (interaction.user.id !== interaction.message.interaction.user.id) {
                    return interaction.reply({ content: 'Вы не отправитель этой операции.', ephemeral: true });
                }

                return ancetSaveData(interaction, name, age, city, description);
            }
        });
        collector.on('end', collected => console.log(`Собрано ${collected.size} элементов`));
    });
}
async function ancetSaveData(interaction, name, age, city, description) {
    const cityFound = await FIND_CITY(city);
    const gender = interaction.customId.split('_')[2];
    const interestingGender = interaction.customId.split('_')[3];

    // Prepare the userDetails object based on whether the city is found or not
    const userDetails = {
        userDiscordId: interaction.user.id,
        name,
        age,
        city,
        description,
        gender,
        interestingGender,
        ...(cityFound && { cityEn: cityFound.cityNameEn, country: cityFound.country }),
    };

    // Check if the user already exists in the database
    const existingUser = await User.findOne({ userDiscordId: interaction.user.id });
    if (existingUser) {
        // Update the existing user's details
        Object.assign(existingUser, userDetails);
        existingUser.save().then(user => {
            console.log('Updated user:', user);
        }).catch(error => {
            console.error('Error:', error);
        });
    } else {
        // Create a new user
        createUser(userDetails).then(user => {
            console.log('Created user:', user);
        }).catch(error => {
            console.error('Error:', error);
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
    const embedReply = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle('Заполнение анкеты')
        .setDescription('Вы хотите загрузить ваши фото/видео?');

    const confirmButton = new ButtonBuilder()
        .setCustomId('ancet_photos_upload')
        .setLabel('Да')
        .setStyle(ButtonStyle.Secondary);

    const cancelButton = new ButtonBuilder()
        .setCustomId('ancet_photos_cancel')
        .setLabel('Нет')
        .setStyle(ButtonStyle.Secondary);

    const choseRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    await interaction.deferUpdate();
    const message = await interaction.message.edit({
        embeds: [embedReply],
        components: [choseRow],
        files: []
    });

    const filter = (i) => i.customId === 'ancet_photos_upload' || i.customId === 'ancet_photos_cancel';
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 180000 });

    collector.on('collect', async (i) => {
        if (i.customId === 'ancet_photos_upload') {
            await i.deferUpdate();
            const uploadEmbed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle('Загрузите ваши фото/видео')
                .setDescription('Пожалуйста, отправьте ваши фото или видео до 15 секунд (максимум 3 файла) в течение 3 минут.');

            await i.editReply({ embeds: [uploadEmbed], components: [] });

            const messageFilter = (m) => m.author.id === i.user.id && m.attachments.size > 0;
            const messageCollector = i.channel.createMessageCollector({ filter: messageFilter, time: 180000 });

            let uploadedFiles = 0;

            messageCollector.on('collect', async (message) => {
                const attachments = message.attachments;

                if (uploadedFiles >= 3) {
                    await message.reply('Вы уже загрузили максимальное количество файлов.');
                    return;
                }

                for (const attachment of attachments.values()) {
                    if (uploadedFiles >= 3) break;

                    if (attachment.contentType.startsWith('image/') || (attachment.contentType.startsWith('video/') && attachment.size <= 15 * 1024 * 1024)) {
                        const fileUrl = attachment.url;
                        const fileName = attachment.name;
                        const filePath = path.join(__dirname, `../uploads/${i.user.id}`, fileName);

                        try {
                            // Check if the user already exists in the database
                            const userDB = await User.findOne({ userDiscordId: interaction.user.id });
                            if (!userDB) {
                                await message.reply('Ваша анкета не была найдена, пожалуйста заполните анкету заново.');
                                return;
                            }

                            // Create and save the photo document
                            const photo = new Photo({
                                name: fileName,
                                userDiscordId: interaction.user.id,
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
                                await photo.save();

                                userDB.photos.push(photo._id);
                                await userDB.save();

                                console.log(`Saved attachment: ${filePath}`);
                                await i.followUp(`Ваш файл ${fileName} успешно загружен и сохранен.`);

                                uploadedFiles++;
                                if (uploadedFiles >= 3) {
                                    messageCollector.stop();
                                    await i.followUp('Вы загрузили максимальное количество файлов.');
                                }
                            });

                            response.data.on('error', (err) => {
                                console.error('Error downloading the file:', err);
                                message.reply('Произошла ошибка при сохранении файла.');
                            });
                        } catch (error) {
                            console.error('Error fetching the file:', error);
                            await message.reply('Произошла ошибка при загрузке файла.');
                        }
                    } else {
                        await message.reply('Ваш файл не подходит по требованиям. Пожалуйста, отправьте фото или видео до 15 секунд.');
                    }
                }
            });

            messageCollector.on('end', (collected) => {
                if (collected.size === 0) {
                    i.followUp('Вы не загрузили фото или видео вовремя.');
                }
            });
        } else if (i.customId === 'ancet_photos_cancel') {
            await i.deferUpdate();
            await i.editReply({ content: 'Вы отменили загрузку фото/видео.', embeds: [], components: [] });
        }
    });
};

async function ancetFillDescription(interaction) {
// Create the modal
    const modal = new ModalBuilder()
        .setCustomId('ancet_descriptionfilldata')
        .setTitle('ЗАПОЛНЕНИЕ ОПИСАНИЯ');

    const descriptionInput = new TextInputBuilder()
        .setCustomId('descriptionInput')
        .setLabel("Расскажите про себя")
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
            console.log('User not found');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}



module.exports = { ancetFillModal, ancetFillGender, ancetFillPhotos, ancetFillDescription, ancetFillDescriptionData };
