const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');

module.exports = (interaction) => {
    const embedReply = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle('Заполнение анкеты');

    const request = new ButtonBuilder()
        .setCustomId(`ancet_fill`)
        .setLabel('Заполнить анкету')
        .setStyle(ButtonStyle.Danger);

    const choseRow = new ActionRowBuilder().addComponents(request);

    embedReply.setDescription(`заполните анкету для взаимодействия с ботом`);

    // Отправляем сообщение только если оно пришло из нужного канала
    return interaction.reply({ embeds: [ embedReply], components: [choseRow], fetchReply: true })
}