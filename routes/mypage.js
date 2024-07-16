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

router.get('', verify, async (req, res) => {
    try {
        const isRead = await updateLocation(req, 'mypage')
        const result = await db.collection('user').findOne({ username: req.user.username });
        res.render('mypage.ejs', { 아이디: result, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

router.put('/name', async (req, res) => {
    try {
        if (req.body.name.length > 20) {
            return res.status(400).send("<script>alert('아이디는 20글자 이하로 지정해주세요.');window.location.replace(`/mypage`);</script>");
        }
        const result = await db.collection('user').findOne({ username: req.body.name })
        if (result) {
            return res.status(409).send("<script>alert('이미 존재하는 아이디 입니다');window.location.replace(`/mypage`);</script>");
        }
        await db.collection('user').updateOne({ _id: new ObjectId(req.user._id) }, { $set: { username: req.body.name } })
        await db.collection('comment').updateMany({ userId: new ObjectId(req.user._id) }, { $set: { username: req.body.name } })
        await db.collection('post').updateMany({ 작성자_id: new ObjectId(req.user._id) }, { $set: { 작성자: req.body.name } })
        return res.send("<script>alert('닉네임이 변경되었습니다');window.location.replace(`/mypage`);</script>");
    } catch (err) {
        serverError(err, res)
    }
})

router.put('/profileImg', upload.single('img1'), async (req, res, next) => {
    try {
        await db.collection('user').updateOne({ _id: new ObjectId(req.user._id) }, { $set: { imgName: req.file.key } })
        await db.collection('comment').updateMany({ userId: new ObjectId(req.user._id) }, { $set: { userprofile: req.file.key } })
        return res.send("<script>alert('프로필 사진이 변경되었습니다');window.location.replace(`/mypage`);</script>");
    } catch (err) {
        serverError(err, res)
    }
});

module.exports = router