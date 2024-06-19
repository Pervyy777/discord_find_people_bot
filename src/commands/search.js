const { SlashCommandBuilder } = require('discord.js');
const SEARCH = require ('../utils/search.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setNameLocalizations({
            ru: 'поиск',
        })
        .setDescription('Start search')
        .setDescriptionLocalizations({
            ru: 'Начать поиск',
        }).setDMPermission(true),
    async execute(interaction) {
        await SEARCH(interaction)
    },
};
