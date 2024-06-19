const User = require("../models/user");
const Like = require("../models/like");
const Profile = require("../models/profile");
const Verify = require("../models/verify");
const SEARCH = require("../utils/search");
const LIKED_USERS = require("../utils/likedUsers");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder,TextInputStyle,TextInputBuilder } = require("discord.js");
const fetchPhotoFiles = require("../utils/takePhotos");

const language = require('../utils/language');

async function ancetAnswerLike(interaction) {
    try {
        const lang = interaction.locale; 
        const likeID = interaction.customId.split('_')[2];
        const likeDB = await Like.findOne({ _id: likeID });
        const existingUserUserDB =  await User.findOne({ _id: likeDB.userWhoLiked });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (UserDB && existingUserUserDB && UserDB._id.toString() === likeDB.userLiked.toString() ) {
               // Convert ObjectId to string for comparison
   UserDB.liked = UserDB.liked.filter(function(item) {
    return item.toString() !== likeDB._id.toString();
  });

  // Save the updated user object
  try {
    await UserDB.save();
    console.log('Like removed and user saved successfully.');
  } catch (error) {
    console.error('Error saving user:', error);
  }

            if (!existingUserUserDB.couple.includes(UserDB._id)) {

            // Push the ObjectId to the couple array
            existingUserUserDB.couple.push(UserDB._id);
            await existingUserUserDB.save();


            let text = existingUserUserDB.couple.length < 2 
                ? language.getLocalizedString(existingUserUserDB.language, 'mutualLikeSingle')
                .replace('{count}', existingUserUserDB.couple.length) 
                : language.getLocalizedString(existingUserUserDB.language, 'mutualLikeMultiple')
                .replace('{count}', existingUserUserDB.couple.length);

            const embedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(text);

            const yes = new ButtonBuilder()
                .setCustomId(`ancetanswer_yes`)
                .setStyle(ButtonStyle.Primary)
                .setLabel(language.getLocalizedString(existingUserUserDB.language, 'yes'));

            const choseRow = new ActionRowBuilder().addComponents(yes);


            const options = {
                embeds: [embedReply],
                components: [choseRow],
                fetch: true
            };

            try {
                const existingUserVerify = await Verify.findOne({ userDiscordId: existingUserUserDB.userDiscordId });
                const channel = interaction.message.client.channels.cache.get(existingUserVerify.roomDiscordId);

                await channel.send(options);
            } catch (error) {
                console.error('Error sending message:', error);
            }

            const userEmbedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(`<@${existingUserUserDB.userDiscordId}>, ${existingUserUserDB.name}, ${existingUserUserDB.age}, ${existingUserUserDB.city} - ${existingUserUserDB.description}`);

            const userOptions = {
                content: `<@${existingUserUserDB.userDiscordId}>`,
                embeds: [userEmbedReply],
                files: await fetchPhotoFiles(existingUserUserDB),
                fetch: true
            };

            try {
                const userVerify = await Verify.findOne({ userDiscordId: UserDB.userDiscordId });
                const channel = interaction.message.client.channels.cache.get(userVerify.roomDiscordId);

                await channel.send(userOptions);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
            
        } else {
            console.log('User not found');
        }
        return LIKED_USERS(interaction);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


async function ancetAnswerDislike(interaction) {
    try {
        const likeID = interaction.customId.split('_')[2];
        const likeDB = await Like.findOne({ _id: likeID });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (UserDB && likeDB) {
   // Convert ObjectId to string for comparison
   UserDB.liked = UserDB.liked.filter(function(item) {
    return item.toString() !== likeDB._id.toString();
  });
            await UserDB.save();
        } else {
            console.log('User not found');
        }
        return LIKED_USERS(interaction)
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function ancetAnswerReport(interaction) {
    try {
        const lang = interaction.locale; 
        const likeID = interaction.customId.split('_')[2];

        // Create the modal
const modal = new ModalBuilder()
.setCustomId(`ancetanswer_report_${likeID}`)
.setTitle(language.getLocalizedString(lang, 'reportTitle'));

// Add components to modal
const reason = new TextInputBuilder()
.setCustomId('reason')
.setLabel(language.getLocalizedString(lang, 'reportReasonLabels'))
.setStyle(TextInputStyle.Short)
.setRequired(true);

const descriptionInput = new TextInputBuilder()
.setCustomId('description')
.setLabel(language.getLocalizedString(lang, 'reportDescriptionLabel'))
.setStyle(TextInputStyle.Paragraph)
.setRequired(false);


// An action row only holds one text input,
const actionRow1 = new ActionRowBuilder().addComponents(reason);
const actionRow2 = new ActionRowBuilder().addComponents(descriptionInput);

// Add inputs to the modal
modal.addComponents(actionRow1, actionRow2);

// Show the modal to the user
return interaction.showModal(modal);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


async function ancetAnswerYes(interaction) {
    try {
        const lang = interaction.locale; // Fetch the locale directly from interaction (assuming it's already available)

        const userDB = await User.findOne({ userDiscordId: interaction.user.id }).populate('couple');

        if (!userDB) {
            console.log('User not found');
            return interaction.reply(language.getLocalizedString(lang, 'userNotFound'));
        }

        if (userDB.couple && userDB.couple.length > 0) {
            await userDB.couple.forEach(async (coupleUser) => {
                const embedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(`<@${coupleUser.userDiscordId}>, ${coupleUser.name}, ${coupleUser.age}, ${coupleUser.city} - ${coupleUser.description}`);

                const options = {
                    content: `<@${coupleUser.userDiscordId}>`,
                    embeds: [embedReply],
                    files: await fetchPhotoFiles(coupleUser),
                    fetch: true
                };

                try {
                    const userVerify = await Verify.findOne({ userDiscordId: userDB.userDiscordId });
                    const channel = interaction.message.client.channels.cache.get(userVerify.roomDiscordId);
    
                    await channel.send(options);
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            });

            userDB.couple = []
            await userDB.save()
        } else {
            return interaction.reply(language.getLocalizedString(lang, 'noCouples'));
        }
    } catch (error) {
        console.error('An error occurred:', error);
        return interaction.reply(language.getLocalizedString(lang, 'errorProcessing'));
    }
}

module.exports = {ancetAnswerLike, ancetAnswerDislike, ancetAnswerReport, ancetAnswerYes}