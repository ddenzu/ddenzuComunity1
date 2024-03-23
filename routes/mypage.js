const router = require('express').Router()
let connectDB = require('../utils/database.js')
let upload = require('../utils/upload.js')
const { ObjectId } = require('mongodb')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

router.get('', async (req, res) => {
    try {
        if (!req.user) {
            return res.send("<script>alert('로그인 요망');window.location.replace(`/login`)</script>");
        }
        await db.collection('user').updateOne(
            { _id: req.user._id },
            { $set: { location: 'mypage' } }
        );
        let result = await db.collection('user').findOne({ username: req.user.username });
        let isRead = req.user ? req.user.isRead : true;
        res.render('mypage.ejs', { 아이디: result, isRead });
    } catch (e) {
        console.error(e);
        res.status(500).send('서버 에러');
    }
})

router.put('/name', async (req, res) => {
    try {
        let result = await db.collection('user').findOne({ username: req.body.name })
        if (result) {
            return res.send("<script>alert('이미 존재하는 아이디 입니다');window.location.replace(`/mypage`);</script>");
        }
        await db.collection('user').updateOne({ _id: new ObjectId(req.user._id) }, { $set: { username: req.body.name } })
        await db.collection('comment').updateMany({ userId: new ObjectId(req.user._id) }, { $set: { username: req.body.name } })
        await db.collection('post').updateMany({ 작성자_id: new ObjectId(req.user._id) }, { $set: { 작성자: req.body.name } })
        return res.send("<script>alert('닉네임이 변경되었습니다');window.location.replace(`/mypage`);</script>");
    }
    catch (e) {
        console.log(e)
        return res.status(500).send('서버에러')
    }
})

router.put('/profileImg', upload.single('img1'), async (req, res, next) => {
    try {
        await db.collection('user').updateOne({ _id: new ObjectId(req.user._id) }, { $set: { imgName: req.file.key } })
        await db.collection('comment').updateMany({ userId: new ObjectId(req.user._id) }, { $set: { userprofile: req.file.key } })
        return res.send("<script>alert('프로필 사진이 변경되었습니다');window.location.replace(`/mypage`);</script>");
    } catch (err) {
        console.log(err);
        res.status(500).send('서버 에러');
    }
});

module.exports = router