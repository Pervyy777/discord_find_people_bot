const User = require("../models/user");
const Like = require("../models/like");
const Profile = require("../models/profile");
const Verify = require("../models/verify");
const {containsForbiddenWords} = require("./ancet_fill")
const SEARCH = require("../utils/search");
const LIKED_USERS = require("../utils/likedUsers");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder,TextInputStyle,TextInputBuilder } = require("discord.js");
const fetchPhotoFiles = require("../utils/takePhotos");

const language = require('../utils/language');

async function ancetLookLike(interaction) {
    try {
        const lang = interaction.locale; 
        const profileID = interaction.customId.split('_')[2];

        const existingUserProfile = await Profile.findOne({ _id: profileID });
        const existingUserUserDB = await User.findOne({ profile: profileID });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (!existingUserProfile) {
            console.log('Profile not found for ID:', profileID);
        }
        if (!existingUserUserDB) {
            console.log('User not found for ID:', profileID);
        }
        if (!UserDB) {
            console.log('Current user not found for Discord ID:', interaction.user.id);
        }

        if (existingUserProfile && UserDB && existingUserUserDB) {
            if (!existingUserProfile.ratedUsers.includes(UserDB._id)) {
                
            let message

            try{message = interaction.fields.getTextInputValue('message');}catch(error){}
            if(message)
                
            if (containsForbiddenWords(message)){
                return interaction.reply(language.getLocalizedString(lang, 'contentNotAllowed')); 
            }
            const likeDetails = {
                userLiked: existingUserUserDB._id,
                userWhoLiked: UserDB._id,
                ...(message && { message}),
            };

            const newLike = new Like(likeDetails);
            await newLike.save();

            existingUserUserDB.liked.push(newLike._id);
            await existingUserUserDB.save();

            existingUserProfile.ratedUsers.push(UserDB._id);
            await existingUserProfile.save();

            let text = existingUserUserDB.liked.length == 1 
                ? language.getLocalizedString(existingUserUserDB.language, 'likedUserSingular')
                .replace('{count}', existingUserUserDB.liked.length) 
                : language.getLocalizedString(existingUserUserDB.language, 'likedUserPlural')
                .replace('{count}', existingUserUserDB.liked.length) ;

            const embedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(text);

            const yes = new ButtonBuilder()
                .setCustomId(`ancetlook_yesantwort`)
                .setStyle(ButtonStyle.Primary)
                .setLabel(language.getLocalizedString(existingUserUserDB.language, 'yes'));

            const stopSearch = new ButtonBuilder()
                .setCustomId(`ancetlook_nomoresearch`)
                .setStyle(ButtonStyle.Danger)
                .setLabel(language.getLocalizedString(existingUserUserDB.language, 'noMoreSearch'));

            const choseRow = new ActionRowBuilder().addComponents(yes, stopSearch);

            const options = {
                embeds: [embedReply],
                components: [choseRow],
                files: [],
                fetch: true
            };

            try {
                const existingUserVerify = await Verify.findOne({ userDiscordId: existingUserUserDB.userDiscordId });
                if (existingUserVerify) {
                    const channel = interaction.message.client.channels.cache.get(existingUserVerify.roomDiscordId);
                    if (channel) {
                        await channel.send(options);
                    } else {
                        console.error('Channel not found for roomDiscordId:', existingUserVerify.roomDiscordId);
                    }
                } else {
                    console.error('Verification not found for userDiscordId:', existingUserUserDB.userDiscordId);
                }
            } catch (error) {
                console.error('Error sending message to the channel:', error);
            }}
/*
            try {
                const user = interaction.message.client.users.cache.get(existingUserUserDB.userDiscordId);
                if (user) {
                    await user.send(options);
                } else {
                    console.error('User not found in client cache for userDiscordId:', existingUserUserDB.userDiscordId);
                }
            } catch (error) {
                console.error('Error sending message to the user:', error);
            }}
*/
        } else {
            console.log('User or profile not found, unable to process like interaction.');
        }
        return SEARCH(interaction);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function ancetLookDislike(interaction) {
    try {
        const profileID = interaction.customId.split('_')[2];

        const existingUserProfile = await Profile.findOne({ _id: profileID });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (!existingUserProfile) {
            console.log('Profile not found for ID: ', profileID);
        }
        if (!UserDB) {
            console.log('Current user not found for Discord ID: ', interaction.user.id);
        }

        if (existingUserProfile && UserDB) {
            if (!existingUserProfile.ratedUsers.includes(UserDB._id)) {
                existingUserProfile.ratedUsers.push(UserDB._id);
                await existingUserProfile.save();
            } else {
                console.log('User has already rated this profile.');
            }
        } else {
            console.log('User or profile not found, unable to process dislike interaction.');
        }
        return SEARCH(interaction);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


async function ancetLookReport(interaction) {
    try {
        const lang = interaction.locale; 
        const profileID = interaction.customId.split('_')[2];
            // Create the modal
    const modal = new ModalBuilder()
    .setCustomId(`ancetlook_report_${profileID}`)
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

async function ancetLookYesantwort(interaction) {
    await LIKED_USERS(interaction);
}

async function ancetLookNoMoreSearch(interaction) {
    const lang = interaction.locale; 
    // Check if the user already exists in the database
    const existingUser = await User.findOne({ userDiscordId: interaction.user.id });

    await Profile.findByIdAndDelete(existingUser.profile)

    existingUser.profile = null
    await existingUser.save()
    return interaction.reply("ready")
}

async function ancetLookMessage(interaction) {
    try {
        const lang = interaction.locale; 
        const profileID = interaction.customId.split('_')[2];
            // Create the modal
    const modal = new ModalBuilder()
    .setCustomId(`ancetlook_message_${profileID}`)
    .setTitle(language.getLocalizedString(lang, 'userMessage'));

// Add components to modal
const message = new TextInputBuilder()
    .setCustomId('message')
    .setLabel(language.getLocalizedString(lang, 'enterMessage'))
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

// An action row only holds one text input,
const actionRow1 = new ActionRowBuilder().addComponents(message);

// Add inputs to the modal
modal.addComponents(actionRow1);

// Show the modal to the user
return interaction.showModal(modal);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

module.exports = { ancetLookLike, ancetLookDislike, ancetLookReport, ancetLookYesantwort , ancetLookNoMoreSearch, ancetLookMessage};