const Profile = require('../../models/profile');
const User = require('../../models/user');
const log = require("../../utils/debugLog");

module.exports = async function (client) {
    try {
        const guild = await client.guilds.fetch(process.env.SERVER_ID);
        if (!guild) {
            console.error('Guild not found');
            return;
        }

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const expiredProfiles = await Profile.find({ lastActivity: { $lte: weekAgo } });

        for (const expiredProfile of expiredProfiles) {
            const userDb = await User.find({ profile: expiredProfile._id });
            if (userDb.length === 0) {
                console.error('No users found for expired profile:', expiredProfile._id);
            }else{
                userDb.profile = null;
            }

            // Delete the expired profile
            await Profile.deleteOne({ _id: expiredProfile._id });
        }
        log('i',`Expired ${expiredProfiles.length} profiles deleted.`);
    } catch (error) {
        console.error('Error deleting profiles:', error);
    }
};
