const Verify = require('../models/verify');
const log = require("../utils/debugLog");
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const Redis = require('ioredis');

// Set up Redis client
const redis = new Redis();

const CATEGORY_LIMIT = 50; // Discord category limit for channels

async function createVerify(verifyDetails) {
    try {
        const newVerify = new Verify(verifyDetails);
        await newVerify.save();
        console.log('Verify created successfully:', newVerify);
        return newVerify;
    } catch (error) {
        console.error('Error creating verify:', error);
        throw error;
    }
}

async function findOrCreateCategory(guild, categoryName) {
    let categoryIds = await redis.lrange(`guild:${guild.id}:categories`, 0, -1);
    let category;

    console.log(`Fetched category IDs from Redis: ${categoryIds}`);

    for (const categoryId of categoryIds) {
        const existingCategory = guild.channels.cache.get(categoryId);
        if (existingCategory && existingCategory.type === 4) { // 4 is the type for category
            console.log(`Found existing category: ${existingCategory.name} with ${existingCategory.children.cache.size} channels`);
            if (existingCategory.children.cache.size < CATEGORY_LIMIT) {
                category = existingCategory;
                break;
            }
        } else {
            console.log(`Category ID ${categoryId} not found in guild cache, removing from Redis.`);
            await redis.lrem(`guild:${guild.id}:categories`, 0, categoryId);
        }
    }

    if (!category) {
        category = await guild.channels.create({
            name: categoryName,
            type: 4, // Correct type for category
        });
        await redis.rpush(`guild:${guild.id}:categories`, category.id);
        console.log(`Created new category: ${category.name}`);
    }

    return category;
}

module.exports = {
    name: 'guildMemberAdd',
    async execute(interaction, client) {
        const userId = interaction.user.id;
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

                    const verifyDetails = {
                        userDiscordId: interaction.user.id,
                        roomDiscordId: newRoom.id,
                    };
                    await createVerify(verifyDetails);
                    
                    const startMessageEmbed = new EmbedBuilder()
                    .setTitle('Добро пожаловать в канал поиска людей из вашего города!')
                    .setDescription('- Перед использованием бота советуем ознакомиться с правилами в канале <#1243259987229278360>. Если у вас возникли вопросы или вам нужна помощь, загляните в канал <#1249368481225244793>.\n\n- Чтобы найти людей из вашего города, просто используйте команду "/search", указав свое имя, возраст, город и что ищете. \n\n- Пожалуйста, будьте вежливы и уважайте других участников канала. Надеемся, вы найдете интересных людей и проведете время с пользой!');

                    // Assuming `newRoom` is the object representing the room or channel to send the message
                    newRoom.send({embeds: [startMessageEmbed]});

                    console.log('Account registered successfully!');
                } else {
                    const existingRoom = interaction.guild.channels.cache.get(existingUser.roomDiscordId);

                    if (existingRoom) {
                        await existingRoom.permissionOverwrites.create(interaction.user.id, {
                            ViewChannel: true,
                            SendMessages: true,
                            ReadMessageHistory: true,
                        });
                        console.log('User already verified. Added to the existing room.');
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
                        console.log('Existing verification found, but room does not exist. Created a new room.');
                    }
                }
            }
        } catch (error) {
            console.error('Error handling guildMemberAdd event:', error);
        }
    },
};
