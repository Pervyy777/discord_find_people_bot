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
    ban: {
        type: Schema.Types.ObjectId,
        ref: 'Ban',
    },
    banHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Ban',
    }],
    language: {
        type: String,
        enum: ['en', 'ru'],
        required: true,
        default: "ru",
    },
});

const Verify = model('Verify', verifySchema);

module.exports = Verify;
