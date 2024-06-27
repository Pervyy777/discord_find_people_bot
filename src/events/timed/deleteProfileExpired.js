const Profile = require('../../models/profile');
const User = require('../../models/user');
const log = require("../../utils/debugLog");

module.exports = async function () {
    try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const expiredProfiles = await Profile.find({ lastActivity: { $lte: weekAgo } });

        for (const expiredProfile of expiredProfiles) {
            const userDb = await User.findById(expiredProfile.user);
            if (userDb.length === 0) {
                log("w",'No users found for expired profile:', expiredProfile._id);
            }else{
                await User.updateOne(
                    { _id: userDb._id },  // Replace with the appropriate user identifier
                    { $unset: { profile: "" } }
                 )
            }

            // Delete the expired profile
            await Profile.deleteOne({ _id: expiredProfile._id });
        }
        log('i',`Expired ${expiredProfiles.length} profiles deleted.`);
    } catch (error) {
        log("e",'Error deleting profiles:', error);
    }
};
