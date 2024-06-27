const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require("../models/user");
const Like = require("../models/like");
const SEARCH = require("./search");
const fetchPhotoFiles = require('./takePhotos');
const log = require('./debugLog.js');
const language = require('./language');

module.exports = async (interaction) => {
    const lang = interaction.locale; 
    try {
        const userDB = await User.findOne({ userDiscordId: interaction.user.id });
        if (!userDB) {
            await interaction.editReply(language.getLocalizedString(lang, 'userNotFound'));
            return;
        }

        if (!userDB.liked || userDB.liked.length === 0) {
            return SEARCH(interaction)
        }

        if (!interaction.message)await interaction.deferReply();
        else await interaction.deferUpdate();
        
        let likeDB
        let likedUser
        for (let i = 0; i < userDB.liked.length; i++) {
            likeDB = await Like.findById(userDB.liked[i])

            if (!likeDB) { // Условие проверки
                await userDB.updateOne(
                    { _id: userDB._id },
                    { $pull: { liked: userDB.liked[i] } }
                 )
            }else {
                likedUser = await User.findById(likeDB.userWhoLiked);
                if(likedUser) break;
            };
        }

        if (!likedUser) {
            log("w",'Liked user not found', likeDB.userWhoLiked);
            await interaction.editReply(language.getLocalizedString(lang, 'userNotFound'));
            return;
        }

        const text = likeDB.message? language.getLocalizedString(lang, 'userMessageText').replace('{message}', likeDB.message) : ""
        const embedReply = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(language.getLocalizedString(lang, 'likedYourProfile') + `\n\n${likedUser.name}, ${likedUser.age}, ${likedUser.city} - ${likedUser.description}${text}`);

        const likeButton = new ButtonBuilder()
            .setCustomId(`ancetanswer_like_${likeDB._id}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👍');

        const dislikeButton = new ButtonBuilder()
            .setCustomId(`ancetanswer_dislike_${likeDB._id}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👎');

        const reportButton = new ButtonBuilder()
            .setCustomId(`ancetanswer_report_${likeDB._id}`)
            .setLabel(language.getLocalizedString(lang, 'report'))
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⚠️');

        const actionRow = new ActionRowBuilder().addComponents(likeButton, dislikeButton, reportButton);

        const photoFiles = await fetchPhotoFiles(likedUser);

        const replyOptions = {
            embeds: [embedReply],
            components: [actionRow],
            files: photoFiles,
            fetchReply: true
        };
        await interaction.message.edit(replyOptions);
    } catch (error) {
        log("e",'Error while processing the interaction:', error);
        try {
            await interaction.editReply(language.getLocalizedString(lang, 'errorProcessing'));
        } catch (editError) {
            log("e",'Error while editing the reply:', editError);
        }
    }
};
