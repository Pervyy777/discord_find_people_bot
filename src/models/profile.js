const { Schema, model} = require('mongoose');

const profileSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    age: {
        type: Number,
        required: true,
    },
    ratedUsers:[{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
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
    cityEn: {
        type: String,
    },
    country: {
        type: String,
    },
});

const Profile = model('Profile', profileSchema);

module.exports = Profile;
