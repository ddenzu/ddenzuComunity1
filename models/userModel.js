const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const saltRounds = 10; 
let connectDB = require('../utils/database.js')
let db;

connectDB.then((client) => {
    db = client.db('forum');
}).catch((err) => {
    console.log(err);
});

// 비밀번호 해싱
exports.hashPassword = async (password) => {
    return bcrypt.hash(password, saltRounds);
};

// 비밀번호 검사
exports.comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

// 이름으로 사용자 찾기
exports.findUserByUsername = async (username) => {
    return db.collection('user').findOne({ username });
};

// 사용자 등록하기
exports.insertUser = async ({ username, password }) => {
    return db.collection('user').insertOne({ 
        username, 
        password, 
        isRead: false 
    });
};

// 사용자 이름 업데이트
exports.updateUsername = async (userId, username) => {
    return db.collection('user').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { username } }
    );
};

// 사용자 프로필 사진 업데이트
exports.updateUserProfileImage = async (userId, fileKey) => {
    return db.collection('user').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { imgName: fileKey } }
    );
};

// 댓글에 존재하는 사용자의 프로필 사진 업데이트
exports.updateUserprofileInComments = async (userId, fileKey) => {
    return db.collection('comment').updateMany(
        { userId: new ObjectId(userId) },
        { $set: { userprofile: fileKey } }
    );
};

// id 로 사용자 찾기
exports.findUserByUserId = async (userId) => {
    return db.collection('user').findOne({ _id: new ObjectId(userId) });
};

// 사용자 위치 찾기
exports.findUserLocation = async (username, location) => {
    return db.collection('user').findOne({ 
        username, 
        location: { $ne: location }
    });
};

// 댓글에 존재하는 사용자의 이름 업데이트
exports.updateUsernamesInComments = async (userId, newUsername) => {
    return db.collection('comment').updateMany(
        { userId: new ObjectId(userId) },
        { $set: { username: newUsername } }
    );
};

// 게시물 작성자의 이름 업데이트
exports.updatePostsUsername = async (userId, newUsername) => {
    return db.collection('post').updateMany(
        { 작성자_id: new ObjectId(userId) },
        { $set: { 작성자: newUsername } }
    );
};

// 메세지 수신자의 이름 업데이트
exports.updateChatroomReceiver = async (beforeUsername, newUsername) => {
    return db.collection('chatroom').updateMany(
        { receiver: beforeUsername },
        { $set: { receiver: newUsername } }
    );
};

// 메세지 발신자의 이름 업데이트
exports.updateChatroomSender = async (beforeUsername, newUsername) => {
    return db.collection('chatroom').updateMany(
        { sender: beforeUsername },
        { $set: { sender: newUsername } }
    );
};

// 채팅방의 이름 업데이트
exports.updateChatroomNames = async (beforeUsername, newUsername) => {
    return db.collection('chatroom').updateMany(
        { 'name': beforeUsername },
        { $set: { 'name.$': newUsername } }
    );
};

// 사용자 위치 업데이트 (메세지 알람에 사용)
exports.updateLocation = async (req, location, isRead) => {
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
        return isRead !== undefined ? isRead : req.user.isRead; // 최신 isRead 반환
    }
    return true;
};
