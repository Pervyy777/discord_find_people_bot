const User = require("../models/user");
const Like = require("../models/like");
const Profile = require("../models/profile");
const Verify = require("../models/verify");
const SEARCH = require("../utils/search");
const LIKED_USERS = require("../utils/likedUsers");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder,TextInputStyle,TextInputBuilder } = require("discord.js");
const fetchPhotoFiles = require("../utils/takePhotos");

async function ancetLookLike(interaction) {
    try {
        console.log(interaction.customId)
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
            const likeDetails = {
                userLiked: existingUserUserDB._id,
                userWhoLiked: UserDB._id,
            };

            const newLike = new Like(likeDetails);
            await newLike.save();

            existingUserUserDB.liked.push(newLike._id);
            await existingUserUserDB.save();

            existingUserProfile.ratedUsers.push(UserDB._id);
            await existingUserProfile.save();

            let text = existingUserUserDB.liked.length == 1 
                ? `Ты понравился ${existingUserUserDB.liked.length} пользователю, показать его?` 
                : `Ты понравился ${existingUserUserDB.liked.length} пользователям, показать их?`;

            const embedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(text);

            const yes = new ButtonBuilder()
                .setCustomId(`ancetlook_yesantwort`)
                .setStyle(ButtonStyle.Primary)
                .setLabel('Да');

            const stopSearch = new ButtonBuilder()
                .setCustomId(`ancetlook_nomoresearch`)
                .setStyle(ButtonStyle.Danger)
                .setLabel('Я больше не ищу');

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
        const profileID = interaction.customId.split('_')[2];
            // Create the modal
    const modal = new ModalBuilder()
    .setCustomId(`ancet_reportlook_${profileID}`)
    .setTitle('ЗАПОЛНЕНИЕ ЖАЛОБЫ');

// Add components to modal
const reason = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel("Введите причину жалобы")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

const descriptionInput = new TextInputBuilder()
    .setCustomId('description')
    .setLabel("Расскажите подробнее")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);


// An action row only holds one text input,
const actionRow1 = new ActionRowBuilder().addComponents(reason);
const actionRow2 = new ActionRowBuilder().addComponents(descriptionInput);

// Add inputs to the modal
modal.addComponents(actionRow1, actionRow2);

// Show the modal to the user
return interaction.showModal(modal);

        /*const userID = interaction.customId.split('_')[2];

        const existingUserProfile = await Profile.findOne({ user: userID });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (!existingUserProfile) {
            console.log('Profile not found for user ID:', userID);
        }
        if (!UserDB) {
            console.log('Current user not found for Discord ID:', interaction.user.id);
        }

        if (existingUserProfile && UserDB) {
            if (!existingUserProfile.ratedUsers.includes(UserDB._id)) {
                existingUserProfile.ratedUsers.push(UserDB._id);
                await existingUserProfile.save();
            } else {
                console.log('User has already rated this profile.');
            }
            return SEARCH(interaction);
        } else {
            console.log('User or profile not found, unable to process report interaction.');
        }*/
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function ancetLookYesantwort(interaction) {
    await LIKED_USERS(interaction);
}

async function ancetLookNoMoreSearch(interaction) {
    // Check if the user already exists in the database
    const existingUser = await User.findOne({ userDiscordId: interaction.user.id });

    await Profile.findByIdAndDelete(existingUser.profile)

    existingUser.profile = null
    await existingUser.save()
    return interaction.reply("ready")
}

module.exports = { ancetLookLike, ancetLookDislike, ancetLookReport, ancetLookYesantwort , ancetLookNoMoreSearch};