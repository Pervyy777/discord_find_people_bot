const { Schema, model} = require('mongoose');

const profileSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ratedUsers:[{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
});

const Profile = model('Profile', profileSchema);

module.exports = Profile;
