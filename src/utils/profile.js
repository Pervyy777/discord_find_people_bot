const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const User = require("../models/user");
const fetchPhotoFiles = require('./takePhotos');

module.exports = async (interaction) => {
    try {
        // Defer the reply to acknowledge the interaction
        await interaction.deferReply();

        // Check if the user already exists in the database
        const userDB = await User.findOne({userDiscordId: interaction.user.id});
        if (!userDB) {
            await interaction.editReply(language.getLocalizedString(lang, 'userNotFound'));
            return;
        }

        // Create the embed with user information
        const embedReply = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(`${userDB.name}, ${userDB.age}, ${userDB.city} - ${userDB.description}`);

        // Create buttons
        const request = new ButtonBuilder()
            .setCustomId('ancet_fill')
            .setLabel(language.getLocalizedString(lang, 'fillTitleProfile'))
            .setStyle(ButtonStyle.Danger);

        const changePhoto = new ButtonBuilder()
            .setCustomId('ancet_photosfill')
            .setLabel(language.getLocalizedString(lang, 'changePhotosVideos'))
            .setStyle(ButtonStyle.Danger);

        const changeDescription = new ButtonBuilder()
            .setCustomId('ancet_descriptionfill')
            .setLabel(language.getLocalizedString(lang, 'changeDescription'))
            .setStyle(ButtonStyle.Danger);

        const choseRow = new ActionRowBuilder().addComponents(request, changePhoto, changeDescription);

        const options = {
            embeds: [embedReply],
            components: [choseRow],
            files: await fetchPhotoFiles(userDB)
        }

        // Send the message with embeds, buttons, and files
        await interaction.editReply(options);
    } catch (error) {
        console.error('Error while processing the interaction:', error);
        try {
            await interaction.editReply(language.getLocalizedString(lang, 'errorProcessing'));
        } catch (editError) {
            console.error('Error while editing the reply:', editError);
        }
    }
};
