const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle} = require('discord.js');
const language = require('./language');


module.exports = async (interaction) => {
    const lang = interaction.locale; 
    const embedReply = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(language.getLocalizedString(lang, 'formTitle'));

    const request = new ButtonBuilder()
        .setCustomId(`fill_promo`)
        .setLabel(language.getLocalizedString(lang, 'fillTitleProfile'))
        .setStyle(ButtonStyle.Danger);

    const choseRow = new ActionRowBuilder().addComponents(request);

    embedReply.setDescription(language.getLocalizedString(lang, 'fillDescriptionProfile'));

    // Отправляем сообщение только если оно пришло из нужного канала
    return interaction.reply({ embeds: [ embedReply], components: [choseRow], fetchReply: true })
}