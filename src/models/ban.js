const { Schema, model} = require('mongoose');

const banSchema = new Schema({
    userDiscordID:{
        type: String,
    },
    date:{
        type: Date,
        default: Date.now
    },
    dateUntil:{
        type: Date,
        default: Date.now
    },
    moderatorDiscordID: {
        type: String,
    },
    report: {
        type: Schema.Types.ObjectId,
        ref: 'Report',
    },
    reason: {
        type: String,
    },
});

const Ban = model('Ban', banSchema);

module.exports = Ban;