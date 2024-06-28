const User = require('../models/user');
const log = require('../utils/debugLog');
const ancet_fill = require('../utils/ancet_fill');
const {
    ancetFillModal, ancetFillGender, ancetFillPhotos, ancetFillDescription, ancetFillDescriptionData, ancetPhotos
} = require('../interactions/ancet_fill');
const {
    ancetLookLike, ancetLookDislike, ancetLookReport, ancetLookYesantwort, ancetLookNoMoreSearch, ancetLookMessage
} = require('../interactions/ancet_look');
const {ancetAnswerLike, ancetAnswerDislike, ancetAnswerReport, ancetAnswerYes} = require('../interactions/ancet_answer');
const Profile  = require('../models/profile');
const {ancetAnswerReportModal, ancetLookReportModal, ancetReportBanModal, ancetReportBan } = require('../interactions/ancet_report')
const Ban  = require('../models/ban');
const {fillPromoCode, fillPromoCodeButtons, checkPromoCodeButtons} = require('../interactions/start_fill');

const language = require('../utils/language'); // Adjust the path based on your project structure

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const lang = interaction.locale; 
        log("i", "interactionCreate");
        try {
            // Fetch the locale directly from interaction (assuming it's already available)
            log("i", lang)

            const userDB = await User.findOne({userDiscordId: interaction.user.id});
            if (userDB) {
                userDB.lastActivity = Date.now();
                userDB.language = interaction.locale;
                // Find user profile by user id
                const userProfile = await Profile.findOne({ _id: userDB.profile });

                if (!userProfile) {
                    const profileDetails = {
                        user: userDB._id,
                        gender: userDB.gender,
                        age: userDB.age,
                        interestingGender: userDB.interestingGender,
                        ...(userDB.cityEn && { cityEn: userDB.cityEn, country: userDB.country }),
                    };
            
                    const newProfile = new Profile(profileDetails);
                    await newProfile.save();

                    userDB.profile = newProfile._id;
                    await userDB.save();
                }
                if (!!userDB.ban) {
                    const banDB = await Ban.findById(userDB.ban);
                    if (banDB) {
                        const reason = banDB.reason || 'No reason specified';
                        const dateUntil = banDB.dateUntil || 'Unknown';
                        return interaction.reply({
                          content: language.getLocalizedString(lang, 'banMessage')
                            .replace('{reason}', reason)
                            .replace('{dateUntil}', dateUntil),
                          ephemeral: true
                        });
                    }
                }
            }
            
            if (interaction.isCommand()) {
                if (!userDB) {
                    return ancet_fill(interaction)
                }
                const {commandName} = interaction;

                const command = client.commands.get(commandName);

                if (!command) return;

                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({
                        content: language.getLocalizedString(lang, 'error'),
                        ephemeral: true
                      });
                }
            } else if (interaction.isButton()) {
                log('i', 'Button interaction detected:', interaction.customId);
                const chose = interaction.customId.split('_')[0];
                const userChoice = interaction.customId.split('_')[1];
                if(userChoice !== 'yesantwort' && userChoice !== 'nomoresearch' && chose !== 'ancetanswer' && chose !== "ancetreport"){
                    // Check if the user interacting with the buttons is the same as the sender
                    if (interaction.user.id !== interaction.message.interaction.user.id) {
                        await interaction.reply({ content: language.getLocalizedString(lang, 'notSender'), ephemeral: true });
                    }
                }

                switch (chose) {
                    case 'ancet':
                        switch (userChoice) {
                            case 'fill':
                                await ancetFillModal(interaction);
                                break;
                            case 'photosfill':
                                await ancetFillPhotos(interaction);
                                break;
                            case 'descriptionfill':
                                await ancetFillDescription(interaction);
                                break;
                                case "photos":
                                    await ancetPhotos(interaction);
                                    break;
                        }
                        break;
                    case 'ancetlook':
                        switch (userChoice) {
                            case 'like':
                                await ancetLookLike(interaction);
                                break;
                            case 'dislike':
                                await ancetLookDislike(interaction);
                                break;
                            case 'report':
                                await ancetLookReport(interaction);
                                break;
                            case 'yesantwort':
                                await ancetLookYesantwort(interaction);
                                break;
                                case 'nomoresearch':
                                    await ancetLookNoMoreSearch(interaction)
                                    break;
                                    case 'message':
                                        console.log("lol")
                                        await ancetLookMessage(interaction)
                                        break;
                        }
                        break;
                    case 'ancetanswer':
                        switch (userChoice) {
                            case 'like':
                                await ancetAnswerLike(interaction);
                                break;
                            case 'dislike':
                                await ancetAnswerDislike(interaction);
                                break;
                            case 'report':
                                await ancetAnswerReport(interaction);
                                break;
                            case 'yes':
                                await ancetAnswerYes(interaction);
                                break;
                        }
                        break;
                        case 'ancetreport':
                            switch (userChoice) {
                                case 'ban':
                                    await ancetReportBan(interaction);
                                    break;
                            }
                            break;
                            case 'fill':
                                switch (userChoice) {
                                    case 'start':
                                        await fillPromoCode(interaction);
                                        break;
                                    case "promo":
                                        await fillPromoCodeButtons(interaction)
                                        break;
                                }
                                break;
                                
                    default:
                        log('w', 'Unknown button interaction:', interaction.customId);
                }
            } else if (interaction.isStringSelectMenu()) {
                log('i', 'StringSelectMenu interaction detected:', interaction);
                const chose = interaction.customId.split('_')[0];
                const userChoice = interaction.customId.split('_')[1];

            } else if (interaction.isModalSubmit()) {
                log('i', 'Modal interaction detected:', interaction);
                const chose = interaction.customId.split('_')[0];
                const userChoice = interaction.customId.split('_')[1];
                switch (chose) {
                    case 'ancet':
                        switch (userChoice) {
                            case 'datafill':
                                await ancetFillGender(interaction);
                                break;
                            case 'descriptionfilldata':
                                await ancetFillDescriptionData(interaction);
                                break;
                        }
                        break;
                        case 'ancetanswer':
                            switch (userChoice) {
                                case 'report':
                                    await ancetAnswerReportModal(interaction);
                                    break;
                            }
                            break;
                            case 'ancetlook':
                                switch (userChoice) {
                                    case 'report':
                                        await ancetLookReportModal(interaction);
                                        break;
                                        case 'message':
                                            console.log("lol")
                                            await ancetLookLike(interaction)
                                            break;
                                }
                                break;
                                case 'ancetreport':
                                    switch (userChoice) {
                                        case 'ban':
                                            await ancetReportBanModal(interaction);
                                            break;
                                    }
                                    break;
                                    case 'promo':
                                        switch (userChoice) {
                                            case 'check':
                                                await checkPromoCodeButtons(interaction);
                                                break;
                                        }
                                        break;
                    default:
                        log('w', 'Unknown modal interaction:', interaction.customId);
                }

            } else if (interaction.isUserSelectMenu()) {
                log('i', 'UserSelectMenu interaction detected:', interaction);
                const chose = interaction.customId.split('_')[0];
                const userChoice = interaction.customId.split('_')[1];
            }
        } catch (error) {
            log("e", error);
            await interaction.reply({ content: language.getLocalizedString(lang, 'interactionError'), ephemeral: true });
            await interaction.reply({content: 'There was an error while interaction!', ephemeral: true});
        }
    },
};