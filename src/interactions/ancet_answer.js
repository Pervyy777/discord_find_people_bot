const User = require("../models/user");
const Like = require("../models/like");
const Profile = require("../models/profile");
const Verify = require("../models/verify");
const SEARCH = require("../utils/search");
const LIKED_USERS = require("../utils/likedUsers");
const {EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require("discord.js");
const fetchPhotoFiles = require("../utils/takePhotos");

async function ancetAnswerLike(interaction) {
    try {
        const userID = interaction.customId.split('_')[2];

        const existingUserUserDB =  await User.findOne({ _id: userID });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (UserDB && existingUserUserDB) {
            UserDB.liked.shift();
            await UserDB.save();

            // Push the ObjectId to the couple array
            existingUserUserDB.couple.push(UserDB._id);
            await existingUserUserDB.save();

            let text = existingUserUserDB.couple.length < 2 
                ? `У тебя есть ${existingUserUserDB.couple.length} взаимная симпатия, показать её?` 
                : `У тебя есть ${existingUserUserDB.couple.length} взаимные симпатии, показать их?`;

            const embedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(text);

            const yes = new ButtonBuilder()
                .setCustomId(`ancetanswer_yes_${existingUserUserDB._id}`)
                .setStyle(ButtonStyle.Primary)
                .setLabel('Да');

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

            return LIKED_USERS(interaction);
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


async function ancetAnswerDislike(interaction) {
    try {
        const userID = interaction.customId.split('_')[2];

        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (UserDB ) {
            UserDB.liked.shift();
            await UserDB.save();
            return LIKED_USERS(interaction)
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function ancetAnswerReport(interaction) {
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


async function ancetAnswerYes(interaction) {
    try {
        const userID = interaction.customId.split('_')[2];

        const userDB = await User.findOne({ userDiscordId: interaction.user.id }).populate('couple');

        if (!userDB) {
            console.log('User not found');
            return interaction.reply("Пользователь не найден");
        }

        console.log(userDB._id.toString(), userID)
        if (userDB._id.toString() !== userID) {
            return interaction.reply("У вас нет доступа к этому перебору взаимных симпатий");
        }

        if (userDB.couple && userDB.couple.length > 0) {
            await userDB.couple.forEach(async (coupleUser) => {
                const embedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(`<@${coupleUser.userDiscordId}>, ${coupleUser.name}, ${coupleUser.age}, ${coupleUser.city} - ${coupleUser.description}`);

                const options = {
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
            return interaction.reply("У пользователя нет пар");
        }
    } catch (error) {
        console.error('An error occurred:', error);
        return interaction.reply("Произошла ошибка при обработке запроса");
    }
}

module.exports = {ancetAnswerLike, ancetAnswerDislike, ancetAnswerReport, ancetAnswerYes}