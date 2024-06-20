const { Schema, model} = require('mongoose');

const photoSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    date:{
        type: Date,
        default: Date.now
    },
    userDiscordId: {
        type: String,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    activ: {
        type: Boolean,
        required: true,
        default: true
    },
});

const Photo = model('Photo', photoSchema);

module.exports = Photo;