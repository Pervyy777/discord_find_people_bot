require('dotenv').config();
const cron = require('node-cron');
const unactivUsers = require('./src/events/timed/deleteProfileExpired');
const updateLikes = require('./src/events/timed/addLikes');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const log = require('./src/utils/debugLog');

mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    log("i",'Connected to MongoDB!');
});
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,

    ],
});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, 'src', 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'src', 'commands', file));
    client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync(path.join(__dirname, 'src', 'events')).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(__dirname, 'src', 'events', file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

//every day
cron.schedule('0 0 * * *', async () => {
    await updateLikes()
    await unactivUsers()
});

client.login(process.env.DISCORD_TOKEN);
