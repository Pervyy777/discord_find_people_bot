const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const User = require("../models/user");
const Profile = require("../models/profile");
const fetchPhotoFiles = require('./takePhotos');

module.exports = async (interaction) => {
    try {
        await interaction.deferReply();

        const userDB = await User.findOne({userDiscordId: interaction.user.id});
        if (!userDB) {
            await interaction.editReply('Ваша анкета не была найдена, пожалуйста заполните анкету заново.');
            return;
        }

        let profile;
        const genderMatch = userDB.interestingGender === 'other' ? {} : {gender: userDB.interestingGender};

        // Function to find profiles matching the user's preferences
        const findProfile = async (matchConditions) => {
            return await Profile.findOne({
                user: {$ne: userDB._id},
                ratedUsers: {$ne: userDB._id}
            }).populate({
                path: 'user',
                match: matchConditions
            });
        };

        // Attempt to find a matching profile based on various conditions
        profile = await findProfile({...genderMatch, interestingGender: userDB.gender, cityEn: userDB.cityEn});

        if (!profile || !profile.user) {
            profile = await findProfile({...genderMatch, interestingGender: userDB.gender, country: userDB.country});
        }

        if (!profile || !profile.user) {
            profile = await findProfile({...genderMatch, interestingGender: userDB.gender});
        }

        if (!profile || !profile.user) {
            const embedReply = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription("Не удалось найти подходящего пользователя.");

            const options = {
                embeds: [embedReply],
                components: [],
                files: []
            };

            if(interaction.message){
                await interaction.message.edit(options);
            }
            else if (interaction.replied || interaction.deferred) {
                await interaction.editReply(options);
            } else {
                await interaction.reply(options);
            }
            return;
        }

        const randomProfile = await User.findOne({_id: profile.user._id});
        if (!randomProfile) {
            console.error('Profile user not found:', profile.user);
            await interaction.editReply('Произошла ошибка при поиске профиля пользователя. Пожалуйста, попробуйте еще раз позже.');
            return;
        }

        const embedReply = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(`${randomProfile.name}, ${randomProfile.age}, ${randomProfile.city} - ${randomProfile.description}`);

        const like = new ButtonBuilder()
            .setCustomId(`ancetlook_like_${randomProfile._id}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👍');

        const dislike = new ButtonBuilder()
            .setCustomId(`ancetlook_dislike_${randomProfile._id}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👎');

        const report = new ButtonBuilder()
            .setCustomId(`ancetlook_report_${randomProfile._id}`)
            .setLabel('Пожаловаться')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⚠️');

        const choseRow = new ActionRowBuilder().addComponents(like, dislike, report);

        const options = {
            embeds: [embedReply],
            components: [choseRow],
            files: await fetchPhotoFiles(randomProfile),
            fetch: true
        };

        if(interaction.message){
            return interaction.message.edit(options);
        }
        else if (interaction.replied || interaction.deferred) {
            return interaction.editReply(options);
        } else {
            return interaction.reply(options);
        }

    } catch (error) {
        console.error('Error while processing the interaction:', error);
        try {
            await interaction.editReply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.');
        } catch (editError) {
            console.error('Error while editing the reply:', editError);
        }
    }
};


