const User = require('../models/user');
const timingProfileExpired = require("./timed/deleteProfileExpired")
const log = require("../utils/debugLog")

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);
        const guild = client.guilds.cache.get(process.env.SERVER_ID);
        // Register all users on the Discord server
        try {
            // Проверяем, находимся ли мы на сервере с нужным идентификатором
            if (client.guilds.cache.has(process.env.SERVER_ID)) {
                const members = await guild.members.fetch();

                for (const [_, member] of members) {
                    if (!member.user.bot) {
                        const existingUser = await User.findOne({ userDiscordId: member.id });

                        if (!existingUser) {
                            // Если пользователь не зарегистрирован, даем ему роль unverify
                            if(member.roles.cache.has(process.env.ROLE_UNVERIFY_ID)) {
                                await member.roles.add(process.env.ROLE_UNVERIFY_ID);
                            }
                        }
                    }
                }

                log('i','All users registered successfully!');
            } else {
                log('i','Bot is not in the specified server.');
            }
        } catch (error) {
            console.error('Error registering users on startup:', error);
        }

        await timingProfileExpired(client);

        // Установка активности бота
        client.user.setActivity({
            name: "looking for a people",
        });
    },
};
