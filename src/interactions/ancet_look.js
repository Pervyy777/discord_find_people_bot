const User = require("../models/user");
const Like = require("../models/like");
const Profile = require("../models/profile");
const Verify = require("../models/verify");
const SEARCH = require("../utils/search");
const LIKED_USERS = require("../utils/likedUsers");
const {EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require("discord.js");
const fetchPhotoFiles = require("../utils/takePhotos");

async function ancetLookLike(interaction) {
    try {
        const userID = interaction.customId.split('_')[2];

        const existingUserProfile = await Profile.findOne({ user: userID });
        const existingUserUserDB =  await User.findOne({ _id: userID });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (existingUserProfile && UserDB && existingUserUserDB ) {
            const likeDetails = {
                userLiked: existingUserUserDB._id,
                userWhoLiked: UserDB._id,
            };

            const newLike = new Like(likeDetails);
            await newLike.save();

            existingUserUserDB.liked += newLike._id;
            await existingUserUserDB.save();

            existingUserProfile.ratedUsers += UserDB._id;
            await existingUserProfile.save();

            let text = existingUserUserDB.liked.length < 2 ? `Ты понравился ${existingUserUserDB.liked.length} пользователю, показать его?` : `Ты понравился ${existingUserUserDB.liked.length} пользователям, показать их?`

            const embedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(text);

            const yes = new ButtonBuilder()
                .setCustomId(`ancetlook_yesantwort`)
                .setStyle(ButtonStyle.Primary)
                .setLabel('Да')

            const stopSearch = new ButtonBuilder()
                .setCustomId(`ancetlook_nomoresearch`)
                .setStyle(ButtonStyle.Danger)
                .setLabel('Я больше не ищу')

            const choseRow = new ActionRowBuilder().addComponents(yes, stopSearch);

            const options = {
                embeds: [embedReply],
                components: [choseRow],
                files: [],
                fetch: true
            };

            try{
                const existingUserVerify = await Verify.findOne({ userDiscordId: existingUserUserDB.userDiscordId });
                const channel = interaction.message.client.channels.cache.get(existingUserVerify.roomDiscordId);

                await channel.send(options)
            }catch(error){console.error('Error sending message:', error);}

            try{
                const user = interaction.message.client.users.cache.get(existingUserUserDB.userDiscordId);
                await user.send(options);
            }catch(error){console.error('Error sending message:', error);}

            return SEARCH(interaction)
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function ancetLookDislike(interaction) {
    try {
        const userID = interaction.customId.split('_')[2];

        const existingUserProfile = await Profile.findOne({ user: userID });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (existingUserProfile && UserDB ) {
            existingUserProfile.ratedUsers += UserDB._id;
            await existingUserProfile.save();
            return SEARCH(interaction)
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function ancetLookReport(interaction) {
    try {
        const userID = interaction.customId.split('_')[2];

        const existingUserProfile = await Profile.findOne({ user: userID });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (existingUserProfile && UserDB ) {
            existingUserProfile.ratedUsers += UserDB._id;
            await existingUserProfile.save();
            return SEARCH(interaction)
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}
async function ancetLookYesantwort(interaction) {
    await LIKED_USERS(interaction);
}

module.exports = {ancetLookLike, ancetLookDislike, ancetLookReport, ancetLookYesantwort}