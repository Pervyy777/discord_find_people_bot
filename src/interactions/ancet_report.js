const User = require("../models/user");
const Like = require("../models/like");
const Profile = require("../models/profile");
const Report = require("../models/report");
const Ban = require("../models/ban");
const Verify = require("../models/verify");
const SEARCH = require("../utils/search");
const LIKED_USERS = require("../utils/likedUsers");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder,TextInputStyle,TextInputBuilder } = require("discord.js");
const fetchPhotoFiles = require("../utils/takePhotos");

async function ancetAnswerReportModal(interaction) {
    try {
    const reason = interaction.fields.getTextInputValue('reason');
    const description = interaction.fields.getTextInputValue('description');
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

                const reportDetails = {
                    user: existingUserUserDB._id,
                    reportedUser: UserDB._id,
                    reason: reason,
                    description: description,
                };
        
                const newReport = new Report(reportDetails);
                await newReport.save();  


            const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(`${existingUserUserDB.name}, ${existingUserUserDB.age}, ${existingUserUserDB.city} - ${existingUserUserDB.description}\n\nreason: ${reason}\ndescription: ${description}`);

            const ban = new ButtonBuilder()
                .setCustomId(`ancetreport_ban_${newReport._id}`)
                .setStyle(ButtonStyle.Primary)
                .setLabel('Ban')
                .setEmoji('🔨');

            const choseRow = new ActionRowBuilder().addComponents(ban);


            const options = {
                embeds: [embed],
                files: await fetchPhotoFiles(existingUserUserDB),
                components: [choseRow],
                fetch: true
            };

            try {
                const channel = interaction.message.client.channels.cache.get(process.env.REPORT_CHAT);
                if (!channel) {
                    console.error('Channel not found or the bot does not have access to the channel');
                } else {
                    await channel.send(options);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }

            const userEmbedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(`жалоба была успешно отправлена`);

            const userOptions = {
                embeds: [userEmbedReply],
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


async function ancetLookReportModal(interaction) {
    try {
        console.log(interaction.customId)
        const profileID = interaction.customId.split('_')[2];
        const reason = interaction.fields.getTextInputValue('reason');
        const description = interaction.fields.getTextInputValue('description');

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
            existingUserProfile.ratedUsers.push(UserDB._id);
            await existingUserProfile.save();

            const reportDetails = {
                user: existingUserUserDB._id,
                reportedUser: UserDB._id,
                reason: reason,
                description: description,
            };
    
            const newReport = new Report(reportDetails);
            await newReport.save();  


        const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setDescription(`${existingUserUserDB.name}, ${existingUserUserDB.age}, ${existingUserUserDB.city} - ${existingUserUserDB.description}\n\nreason: ${reason}\ndescription: ${description}`);

        const ban = new ButtonBuilder()
            .setCustomId(`ancetreport_ban_${newReport._id}`)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Ban')
            .setEmoji('🔨');

        const choseRow = new ActionRowBuilder().addComponents(ban);


        const options = {
            embeds: [embed],
            files: await fetchPhotoFiles(existingUserUserDB),
            components: [choseRow], 
            fetch: true
        };

        try {
            const channel = interaction.message.client.channels.cache.get(process.env.REPORT_CHAT);

            await channel.send(options);
        } catch (error) {
            console.error('Error sending message:', error);
        }

        const userEmbedReply = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(`жалоба была успешно отправлена`);

        const userOptions = {
            embeds: [userEmbedReply],
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
            console.log('User or profile not found, unable to process like interaction.');
        }
        return SEARCH(interaction);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}




module.exports = {ancetAnswerReportModal, ancetLookReportModal }