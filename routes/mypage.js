const router = require('express').Router()
let connectDB = require('../utils/database.js')
const upload = require('../utils/upload.js')
const { ObjectId } = require('mongodb')
const serverError = require('../utils/error.js')
const verify = require('../utils/verify.js')
const updateLocation = require('../utils/location.js')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

// 마이페이지 로드
router.get('', verify, async (req, res) => {
    try {
        const [isRead, user] = await Promise.all([
            updateLocation(req, 'mypage'), 
            db.collection('user').findOne({ username: req.user.username })  
        ]);
        return res.render('mypage.ejs', { 아이디: user, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

// 아이디 변경
router.put('/name', async (req, res) => {
    try {
        if (req.body.name.length > 15) {
            return res.status(400).send('아이디가 15글자를 초과');
        }
        const result = await db.collection('user').findOne({ username: req.body.name })
        if (result) {
            return res.status(409).send("이미 존재하는 아이디");
        }
        const beforeUsername = req.user.username
        await db.collection('user').updateOne({ _id: new ObjectId(req.user._id) }, { $set: { username: req.body.name } })
        await Promise.all([
            db.collection('comment').updateMany(
                { userId: new ObjectId(req.user._id) },
                { $set: { username: req.body.name } }
            ),
            db.collection('post').updateMany(
                { 작성자_id: new ObjectId(req.user._id) },
                { $set: { 작성자: req.body.name } }
            ),
            db.collection('chatroom').updateMany(
                { receiver: beforeUsername },
                { $set: { 'receiver': req.body.name } }
            ),
            db.collection('chatroom').updateMany(
                { sender: beforeUsername },
                { $set: { 'sender': req.body.name } }
            ),
            db.collection('chatroom').updateMany(
                { 'name': beforeUsername },
                { $set: { 'name.$': req.body.name } }
            )
        ]);
        return res.status(200).send("닉네임 변경 성공");
    } catch (err) {
        serverError(err, res)
    }
})

// 프로필 사진 변경
router.put('/profile-image', upload.single('img1'), async (req, res) => {
    try {
        await Promise.all([
            db.collection('user').updateOne(
                { _id: new ObjectId(req.user._id) }, 
                { $set: { imgName: req.file.key } }
            ),
            db.collection('comment').updateMany(
                { userId: new ObjectId(req.user._id) }, 
                { $set: { userprofile: req.file.key } }
            )
        ]);
        return res.status(200).send("프로필 사진 변경 성공");
    } catch (err) {
        serverError(err, res)
    }
});

module.exports = router