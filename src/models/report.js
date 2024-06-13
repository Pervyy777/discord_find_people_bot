const { Schema, model} = require('mongoose');

const reportSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reportedUser:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date:{
        type: Date,
        default: Date.now
    },
    reason: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
});

const Report = model('Report', reportSchema);

module.exports = Report;