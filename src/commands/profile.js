const { SlashCommandBuilder } = require('discord.js');
const PROFILE = require ('../utils/profile.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setNameLocalizations({
            ru: 'профиль',
        })
        .setDescription('User profile')
        .setDescriptionLocalizations({
            ru: 'Профиль пользователя',
        }).setDMPermission(true),
    async execute(interaction) {
        await PROFILE(interaction)
    },
};