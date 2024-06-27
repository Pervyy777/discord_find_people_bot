const Verify = require('../models/verify');
const log = require("../utils/debugLog");
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const Redis = require('ioredis');

// Set up Redis client
const redis = new Redis();

const CATEGORY_LIMIT = 50; // Discord category limit for channels
const language = require('../utils/language');

async function createVerify(verifyDetails) {
    try {
        const newVerify = new Verify(verifyDetails);
        await newVerify.save();
        log("i",'Verify created successfully:', newVerify);
        return newVerify;
    } catch (error) {
        log("e",'Error creating verify:', error);
        throw error;
    }
}

async function findOrCreateCategory(guild, categoryName) {
    let categoryIds = await redis.lrange(`guild:${guild.id}:categories`, 0, -1);
    let category;

    log("i",`Fetched category IDs from Redis: ${categoryIds}`);

    for (const categoryId of categoryIds) {
        const existingCategory = guild.channels.cache.get(categoryId);
        if (existingCategory && existingCategory.type === 4) { // 4 is the type for category
            log("i",`Found existing category: ${existingCategory.name} with ${existingCategory.children.cache.size} channels`);
            if (existingCategory.children.cache.size < CATEGORY_LIMIT) {
                category = existingCategory;
                break;
            }
        } else {
            log("w",`Category ID ${categoryId} not found in guild cache, removing from Redis.`);
            await redis.lrem(`guild:${guild.id}:categories`, 0, categoryId);
        }
    }

    if (!category) {
        category = await guild.channels.create({
            name: categoryName,
            type: 4, // Correct type for category
        });
        await redis.rpush(`guild:${guild.id}:categories`, category.id);
        log("i",`Created new category: ${category.name}`);
    }

    return category;
}

module.exports = {
    name: 'guildMemberAdd',
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const lang = "ru"
        try {
            if (interaction.guild && interaction.guild.id === process.env.SERVER_ID && !interaction.user.bot) {
                const existingUser = await Verify.findOne({ userDiscordId: userId });

                if (!existingUser) {
                    const category = await findOrCreateCategory(interaction.guild, 'Text Room');

                    const newRoom = await interaction.guild.channels.create({
                        name: `Text`,
                        type: 0, // Correct type for text channel
                        parent: category.id,
                        reason: 'Creating verification room',
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionsBitField.Flags.ViewChannel ],
                            },
                            {
                                id: interaction.user.id,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                            },
                            {
                                id: client.user.id,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                            },
                        ],
                    });

                    const verifyDetails = {
                        userDiscordId: interaction.user.id,
                        roomDiscordId: newRoom.id,
                    };
                    await createVerify(verifyDetails);
                    
                    const startMessageEmbed = new EmbedBuilder()
                    .setTitle(language.getLocalizedString(lang, 'startMessageTitle'))
                    .setDescription(language.getLocalizedString(lang, 'startMessageDescription'));

                    // Assuming `newRoom` is the object representing the room or channel to send the message
                    await newRoom.send({embeds: [startMessageEmbed]});

                    log("i",'Account registered successfully!');
                } else {
                    const existingRoom = interaction.guild.channels.cache.get(existingUser.roomDiscordId);

                    if (existingRoom) {
                        await existingRoom.permissionOverwrites.create(interaction.user.id, {
                            ViewChannel: true,
                            SendMessages: true,
                            ReadMessageHistory: true,
                        });
                        log("i",'User already verified. Added to the existing room.');
                    } else {
                        const category = await findOrCreateCategory(interaction.guild, 'Text Room');

                        const newRoom = await interaction.guild.channels.create({
                            name: `Text`,
                            type: 0, // Correct type for text channel
                            parent: category.id,
                            reason: 'Creating verification room',
                            permissionOverwrites: [
                                {
                                    id: interaction.guild.id,
                                    deny: [PermissionsBitField.Flags.ViewChannel],
                                },
                                {
                                    id: interaction.user.id,
                                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                                },
                                {
                                    id: client.user.id,
                                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                                },
                            ],
                        });

                        existingUser.roomDiscordId = newRoom.id;
                        await existingUser.save();
                        log("w",'Existing verification found, but room does not exist. Created a new room.');
                    }
                }
            }
        } catch (error) {
            log("e",'Error handling guildMemberAdd event:', error);
        }
    },
};
