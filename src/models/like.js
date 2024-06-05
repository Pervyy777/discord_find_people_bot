const { Schema, model} = require('mongoose');

const likeSchema = new Schema({
    date:{
        type: Date,
        default: Date.now
    },
    userWhoLiked: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userLiked: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

const Like = model('Like', likeSchema);

module.exports = Like;