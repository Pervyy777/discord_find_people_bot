const { Schema, model} = require('mongoose');

const verifySchema = new Schema({
    userDiscordId: {
        type: String,
        required: true,
        unique: true,
    },
    roomDiscordId: {
        type: String,
        required: true,
        unique: true,
    },

});

const Verify = model('Verify', verifySchema);

module.exports = Verify;
