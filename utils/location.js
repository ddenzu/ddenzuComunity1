let connectDB = require('./database.js')
const serverError = require('../utils/error.js')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

async function updateLocation(req, location, isRead) {
    if (req.user) {
        if (isRead !== undefined) {
            await db.collection('user').updateOne(
                { _id: req.user._id },
                { $set: { location: location, isRead: isRead } }
            );
        } else {
            await db.collection('user').updateOne(
                { _id: req.user._id },
                { $set: { location: location } }
            );
        }
    }
}

module.exports = updateLocation;