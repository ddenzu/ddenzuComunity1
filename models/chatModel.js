const { ObjectId } = require('mongodb');
let connectDB = require('../utils/database.js')
let db;

connectDB.then((client) => {
    db = client.db('forum');
}).catch((err) => {
    console.log(err);
});

exports.insertMessage = (messageData) => {
    return db.collection('message').insertOne(messageData);
};

exports.findReceiver = (chatroomId, username) => {
    return db.collection('chatroom')
        .findOne({ _id: new ObjectId(chatroomId) })
        .then(data => data.name.filter(name => name !== username));
};

exports.updateUserReadStatus = (receiver, check) => {
    return db.collection('user').updateOne(
        { username: receiver },
        { $set: { isRead: check } }
    );
};

exports.findMessages = (chatroomId) => {
    return db.collection('message').find({ parent: chatroomId }).toArray();
};

exports.watchMessages = (chatroomId) => {
    const pipeline = [
        { $match: { 'fullDocument.parent': chatroomId } }
    ];
    return db.collection('message').watch(pipeline);
};

exports.deleteChatroom = (chatroomId) => {
    return db.collection('chatroom')
    .deleteOne({ _id: new ObjectId(chatroomId) });
};

exports.deleteMessages = (chatroomId) => {
    return db.collection('message')
    .deleteMany({ parent: chatroomId });
};

exports.findChatrooms = (userId) => {
    return db.collection('chatroom')
        .find({ member: userId })
        .toArray();
};

exports.findChatroom = (usernames) => {
    return db.collection('chatroom')
        .findOne({ name: { $all: usernames } });
};

exports.createChatroom = (roomData) => {
    return db.collection('chatroom').insertOne(roomData);
};