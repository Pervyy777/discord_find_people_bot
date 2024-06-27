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
const log = require('../utils/debugLog');

async function ancetAnswerReportModal(interaction) {
    try {
    const reason = interaction.fields.getTextInputValue('reason');
    const description = interaction.fields.getTextInputValue('description');
        const likeID = interaction.customId.split('_')[2];
        const likeDB = await Like.findOne({ _id: likeID });
        const existingUserUserDB =  await User.findOne({ _id: likeDB.userWhoLiked });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (UserDB && existingUserUserDB && UserDB._id.toString() === likeDB.userLiked.toString() ) {
              
  // Save the updated user object
  try {
    await User.updateOne(
        { _id: likeDB._id },
        { $pull: { liked: likeDB._id } }
     )
    log("i",'Like removed and user saved successfully.');
  } catch (error) {
    log("e",'Error saving user:', error);
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

const text = likeDB.message? `\n \nСообщение от пользователя: ${likeDB.message}` : ""
            const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(`${existingUserUserDB._id}, ${existingUserUserDB.name}, ${existingUserUserDB.age}, ${existingUserUserDB.city} - ${existingUserUserDB.description}\n\nreported:${UserDB._id}\nreason: ${reason}\ndescription: ${description}`);

            const ban = new ButtonBuilder()
                .setCustomId(`ancetreport_ban_${newReport._id}`)
                .setStyle(ButtonStyle.Danger)
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
                    log("e",'Channel not found or the bot does not have access to the channel');
                } else {
                    await channel.send(options);
                }
            } catch (error) {
                log("e",'Error sending message:', error);
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
                log("e",'Error sending message:', error);
            }
        }
            
        } else {
            log("w",'User not found');
        }
        return LIKED_USERS(interaction);
    } catch (error) {
        log("e",'An error occurred:', error);
    }
}


async function ancetLookReportModal(interaction) {
    try {
        const profileID = interaction.customId.split('_')[2];
        const reason = interaction.fields.getTextInputValue('reason');
        const description = interaction.fields.getTextInputValue('description');

        const existingUserProfile = await Profile.findById( profileID );
        const existingUserUserDB = await User.findOne({ profile: profileID });
        const UserDB = await User.findOne({ userDiscordId: interaction.user.id });

        if (!existingUserProfile) {
            log("w",'Profile not found for ID:', profileID);
        }
        if (!existingUserUserDB) {
            log("w",'User not found for ID:', profileID);
        }
        if (!UserDB) {
            log("w",'Current user not found for Discord ID:', interaction.user.id);
        }

        if (existingUserProfile && UserDB && existingUserUserDB) {
            if (!existingUserProfile.ratedUsers.includes(UserDB._id)) {
                await Profile.updateOne(
                    { _id: existingUserProfile._id },
                    { $push: { ratedUsers: UserDB._id } } // Ensure user._id is directly pushed
                );

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
        .setDescription(`${existingUserUserDB._id}, ${existingUserUserDB.name}, ${existingUserUserDB.age}, ${existingUserUserDB.city} - ${existingUserUserDB.description}\n\nreported:${UserDB._id}\nreason: ${reason}\ndescription: ${description}`);

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
            log("e",'Error sending message:', error);
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
            log("e",'Error sending message:', error);
        }
    }
        } else {
            log("w",'User or profile not found, unable to process like interaction.');
        }
        return SEARCH(interaction);
    } catch (error) {
        log("e",'An error occurred:', error);
    }
}


async function ancetReportBan(interaction) {
    try {
        const reportID = interaction.customId.split('_')[2];

                // Create the modal
const modal = new ModalBuilder()
.setCustomId(`ancetreport_ban_${reportID}`)
.setTitle('БЛОКИРОВКА ПОЛЬЗОВАТЕЛЯ');

// Add components to modal
const time = new TextInputBuilder()
.setCustomId('time')
.setLabel("Время блокировки(в часах)")
.setStyle(TextInputStyle.Short)
.setValue("1")
.setRequired(true);

const rool = new TextInputBuilder()
.setCustomId('rool')
.setLabel("Причина блокировки")
.setStyle(TextInputStyle.Short)
.setPlaceholder('1.2')
.setRequired(true);


// An action row only holds one text input,
const actionRow1 = new ActionRowBuilder().addComponents(rool);
const actionRow2 = new ActionRowBuilder().addComponents(time);

// Add inputs to the modal
modal.addComponents(actionRow1, actionRow2);

// Show the modal to the user
return interaction.showModal(modal);
    } catch (error) {
        log("e",'An error occurred:', error);
    }
}

async function ancetReportBanModal(interaction) {
    try {
        // Check if user is an administrator
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            await interaction.reply({
                content: 'Only administrators can use this command.',
                ephemeral: true  // Make the response ephemeral (only visible to the user who invoked)
            });
            return;
        }

        const reportID = interaction.customId.split('_')[2];
        const time = interaction.fields.getTextInputValue('time');
        const rool = interaction.fields.getTextInputValue('rool');

        const reportDB = await Report.findOne({ _id: reportID });
        const existingUserUserDB = await User.findOne({ _id: reportDB.user });

        if (existingUserUserDB && reportDB && !existingUserUserDB.ban) {
            await interaction.deferUpdate();

            const banDetails = {
                userDiscordID: existingUserUserDB.userDiscordId,
                dateUntil: new Date(Date.now() + time * 60 * 60 * 1000),
                moderatorDiscordID: interaction.user.id,
                report: reportDB._id,
                reason: rool,
            };

            const newBan = new Ban(banDetails);
            await newBan.save();

            existingUserUserDB.ban = newBan._id;
            await existingUserUserDB.save();
            
            await User.updateOne(
                { _id: existingUserUserDB._id },
                { $push: { banHistory: newBan._id } } // Ensure user._id is directly pushed
            );

            await Profile.findByIdAndDelete(existingUserUserDB.profile);

            await User.updateOne(
                { _id: existingUserUserDB._id },  // Replace with the appropriate user identifier
                { $unset: { profile: "" } }
             )

            return interaction.message.edit({
                content: 'User has been banned successfully.',
                components: []
            });
        } else {
            return interaction.reply({
                content: 'Cannot ban user. Check if the user and report exist or if the user is already banned.',
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('An error occurred:', error);
        return interaction.reply({
            content: 'An error occurred while processing your request.',
            ephemeral: true
        });
    }
}

module.exports = {ancetAnswerReportModal, ancetLookReportModal, ancetReportBanModal, ancetReportBan }