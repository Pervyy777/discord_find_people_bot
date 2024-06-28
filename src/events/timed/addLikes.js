const User = require('../../models/user');
const log = require("../../utils/debugLog");

module.exports = async function () {
    try {
        const usersDB = await User.find();
        log("i", usersDB)

        for (const userDB of usersDB) {
            userDB.likesTodayCount = userDB.likesDayCount
            await userDB.save()
        }
    } catch (error) {
        log("e",'Error updating likes count:', error);
    }
};