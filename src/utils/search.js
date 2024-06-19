const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const User = require("../models/user");
const Profile = require("../models/profile");
const fetchPhotoFiles = require('./takePhotos');

module.exports = async (interaction) => {
    try {
        if (!interaction.message)await interaction.deferReply();
        else await interaction.deferUpdate();
        const userDB = await User.findOne({userDiscordId: interaction.user.id});
        if (!userDB) {
            await interaction.editReply(language.getLocalizedString(lang, 'userNotFound'));
            return;
        }

        let profile;
        const genderMatch = userDB.interestingGender === 'other' ? {} : {gender: userDB.interestingGender};

        // Define an array of match conditions to try in order
        const matchConditionsList = [
            {cityEn: userDB.cityEn, ...genderMatch},
            {country: userDB.country, ...genderMatch},
            {...genderMatch}
        ];
        
        // Function to find profiles matching the user's preferences
        const findProfile = async (matchConditions) => {
            const genderRegex = userDB.gender === 'male' ? /female/ : /male/;
            return await Profile.findOne({
                user: {$ne: userDB._id},
                ratedUsers: {$ne: userDB._id},
                interestingGender: { $not: genderRegex },
                age: { 
                    $gte: userDB.age - 4, 
                    $lte: userDB.age + 2 
                  },
                ...matchConditions
            })
        };

        // Iterate through the match conditions list until a suitable profile is found
        for (const matchConditions of matchConditionsList) {
            profile = await findProfile(matchConditions);
            if (profile && profile.user) break;
        }

        if (!profile || !profile.user) {
            const embedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(language.getLocalizedString(lang, 'noMatchingUser'));

            const options = {
                embeds: [embedReply],
                components: [],
                files: []
            };

            if (interaction.message) {
                await interaction.message.edit(options);
            } else if (interaction.replied || interaction.deferred) {
                await interaction.editReply(options);
            } else {
                await interaction.reply(options);
            }
            return;
        }

        const randomProfile = await User.findOne({_id: profile.user._id});
        if (!randomProfile) {
            console.error('Profile user not found:', profile.user);
            await interaction.editReply(language.getLocalizedString(lang, 'userNotFound'));
            return;
        }

        const embedReply = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(`${randomProfile.name}, ${randomProfile.age}, ${randomProfile.city} - ${randomProfile.description}`);

        const like = new ButtonBuilder()
            .setCustomId(`ancetlook_like_${profile._id}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👍');

        const dislike = new ButtonBuilder()
            .setCustomId(`ancetlook_dislike_${profile._id}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👎');

        const message = new ButtonBuilder()
            .setCustomId(`ancetlook_message_${profile._id}`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('💌');

        const report = new ButtonBuilder()
            .setCustomId(`ancetlook_report_${profile._id}`)
            .setLabel(language.getLocalizedString(lang, 'report'))
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⚠️');

        const choseRow = new ActionRowBuilder().addComponents(message, like, dislike, report);

        const options = {
            embeds: [embedReply],
            components: [choseRow],
            files: await fetchPhotoFiles(randomProfile)
        };

        if (interaction.message) {
            return interaction.message.edit(options);
        } else if (interaction.replied || interaction.deferred) {
            return interaction.editReply(options);
        } else {
            return interaction.reply(options);
        }

    } catch (error) {
        console.error('Error while processing the interaction:', error);
        try {
            await interaction.editReply(language.getLocalizedString(lang, 'errorProcessing'));
        } catch (editError) {
            console.error('Error while editing the reply:', editError);
        }
    }
};
