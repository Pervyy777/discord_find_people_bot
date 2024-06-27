const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    userDiscordId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    cityEn: {
        type: String,
    },
    country: {
        type: String,
    },
    description: {
        type: String,
        default: "",
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true,
    },
    interestingGender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
    },
    lastActivity: {
        type: Date,
        default: Date.now,
    },
    likesDayCount: {
        type: Number,
        default: 40,
    },
    likesTodayCount: {
        type: Number,
        default: 40,
    },
    photos: [{
        type: Schema.Types.ObjectId,
        ref: 'Photo',
    }],
    profile: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
    },
    liked: [{
        type: Schema.Types.ObjectId,
        ref: 'Like',
    }],
    couple: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    language: {
        type: String,
        required: true,
        default: "en",
    },
    promoCode:{
        type: Schema.Types.ObjectId,
        ref: 'PromoCode',
    },
    ban: {
        type: Schema.Types.ObjectId,
        ref: 'Ban',
    },
    banHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Ban',
    }]
});

const User = model('User', userSchema);

module.exports = User;
