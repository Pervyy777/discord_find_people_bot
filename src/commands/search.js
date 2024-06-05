const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder} = require('discord.js');
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
        }),
    async execute(interaction) {

        await SEARCH(interaction)
    },
};
