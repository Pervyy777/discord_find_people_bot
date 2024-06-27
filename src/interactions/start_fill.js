const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle} = require('discord.js');
const language = require('../utils/language');
const PromoCode = require("../models/promoCode")

async function fillPromoCodeButtons(interaction) {
    await interaction.deferUpdate();
    const lang = interaction.locale; 
    const embedReply = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(language.getLocalizedString(lang, 'formPromoTitle'))
        .setDescription(language.getLocalizedString(lang, 'fillPromoAsk'));

    const confirmButton = new ButtonBuilder()
        .setCustomId('fill_start')
        .setLabel(language.getLocalizedString(lang, 'yes'))
        .setStyle(ButtonStyle.Secondary);

    const cancelButton = new ButtonBuilder()
        .setCustomId('ancet_fill')
        .setLabel(language.getLocalizedString(lang, 'no'))
        .setStyle(ButtonStyle.Secondary);

    const choseRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    await interaction.message.edit({
        embeds: [embedReply],
        components: [choseRow],
        files: []
    });
}
async function fillPromoCode(interaction) {
    const lang = interaction.locale; 

      // Create the modal
      const modal = new ModalBuilder()
          .setCustomId('promo_check')
          .setTitle(language.getLocalizedString(lang, 'promoCodeModalTitle'));

      // Add components to modal
      const promoCodeInput = new TextInputBuilder()
          .setCustomId('promoCodeInput')
          .setLabel(language.getLocalizedString(lang, 'promoCodeLabel'))
          .setStyle(TextInputStyle.Short)
          .setRequired(true);


    // An action row only holds one text input,
    const actionRow1 = new ActionRowBuilder().addComponents(promoCodeInput);

    // Add inputs to the modal
    modal.addComponents(actionRow1);

    // Show the modal to the user
    await interaction.showModal(modal);
}

async function checkPromoCodeButtons(interaction) {
    const promoCode = interaction.fields.getTextInputValue('promoCodeInput');
    const lang = interaction.locale; 
    const embedError = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(language.getLocalizedString(lang, 'invalidPromoCodeTitle'))
        .setDescription(language.getLocalizedString(lang, 'invalidPromoCodeDescription').replace('{promoCode}', promoCode));

    // Validate the promo code
    const isValidPromoCode = /^[A-Z0-9]{5}$/.test(promoCode);
    if (!isValidPromoCode) {
        await interaction.reply({
            embeds: [embedError],
            ephemeral: true
        });
        return;
    }

    const promoCodeDB = await PromoCode.findOne({code: promoCode})
    if(!promoCodeDB) {
    await interaction.reply({
        embeds: [embedError],
        ephemeral: true
    });
    return;}

    // If the promo code is valid, proceed with updating the message
    await interaction.deferUpdate();

    const embedReply = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(language.getLocalizedString(lang, 'checkPromoTitle'))
        .setDescription(language.getLocalizedString(lang, 'checkPromoAsk').replace('{promoCode}', promoCode));

    const confirmButton = new ButtonBuilder()
        .setCustomId(`ancet_fill_${promoCode}`)
        .setLabel(language.getLocalizedString(lang, 'yes'))
        .setStyle(ButtonStyle.Secondary);

    const cancelButton = new ButtonBuilder()
        .setCustomId('fill_promo')
        .setLabel(language.getLocalizedString(lang, 'no'))
        .setStyle(ButtonStyle.Secondary);

    const choseRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    await interaction.message.edit({
        embeds: [embedReply],
        components: [choseRow],
        files: []
    });
}




module.exports = { fillPromoCode, fillPromoCodeButtons, checkPromoCodeButtons };
