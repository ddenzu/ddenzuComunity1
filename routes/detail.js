const router = require('express').Router()
const { ObjectId } = require('mongodb')
const requestIp = require('request-ip')
let optimizeImage = require('../utils/optimizeImg.js');
let connectDB = require('../utils/database.js')
let verify = require('../utils/verify.js')
const dateFormat1 = require("./../public/time.js");

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

router.get('/:id', async (req, res) => {
    // req.params 하면 유저가 url 파라미터에 입력한 데이터 가져옴(:id)
    console.log("client IP: " + requestIp.getClientIp(req));
    let isRead = req.user ? req.user.isRead : true;
    try {
        let result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) })
        if (!result) {
            return res.status(400).send('이상한 url')
        }
        let result2 = await db.collection('comment').find({ postId: new ObjectId(req.params.id), parentId: null }).toArray()
        let result3 = await db.collection('user').findOne({ _id: result.작성자_id })
        let result4 = await db.collection('comment').find({ postId: new ObjectId(req.params.id), parentId: { $exists: true } }).toArray()
        var 현재접속자 = req.user ? req.user.username : 'noUser';
        const 이미지주소 = Array.isArray(result.imgName) ? result.imgName : (result.imgName ? [result.imgName] : []);
        const 동영상주소 = Array.isArray(result.vidName) ? result.vidName : (result.vidName ? [result.vidName] : []);
        const 프로필 = result3.imgName ? result3.imgName : '';
        if (req.user) {
            await db.collection('user').updateOne(
                { _id: req.user._id },
                { $set: { location: 'detail' } }
            );
        }
        res.render('detail.ejs', {
            글목록: result,
            댓글목록: result2,
            이미지주소,
            프로필,
            동영상주소,
            현재접속자,
            dateFormat1,
            대댓글: result4,
            isRead
        });
    }
    catch (e) {
        console.log(e)
        res.status(400).send('이상한 url') //500 => 서버문제 , 400 => 유저문제
    }
})

router.post('/comment', verify, async (req, res) => {
    try {
        if (!req.body.content) {
            return res.send("댓글등록 실패");
        }
        var 저장할거 = {
            postId: new ObjectId(req.body.parent), // 작성글 id
            content: req.body.content, // 채팅내용
            username: req.user.username,
            userId: req.user._id,
            userprofile: req.user.imgName,
            date: new Date(),
        };
        await db.collection('comment').insertOne(저장할거);
        res.send('댓글저장');
    } catch (e) {
        console.log(e);
        res.status(500).send('서버에러')
    }
})

router.delete('/comment', async (req, res) => {
    try {
        var 비교1 = JSON.stringify(req.user._id)
        var 비교2 = JSON.stringify(req.body.userId)
        if (비교1 == 비교2) {
            const deletedComment = await db.collection('comment').deleteOne({ _id: new ObjectId(req.body.id) })
            if (deletedComment) {
                return res.send('success');
            } else {
                return res.send("fail");
            }
        } else {
            return res.send("fail");
        }
    } catch (e) {
        console.log(e)
        return res.status(500).send('서버에러')
    }
})

router.post('/recomment', verify, async (req, res) => {
    // console.log(req.body)
    try {
        if (!req.body.content) {
            return res.send("<script>alert('대댓글등록실패');</script>");
        }
        let 저장할거 = {
            postId: new ObjectId(req.body.parent), // 작성글 id
            parentId: new ObjectId(req.body.reparent),
            content: req.body.content, // 채팅내용
            username: req.user.username,
            userId: req.user._id,
            userprofile: req.user.imgName,
            date: new Date(),
        }
        await db.collection('comment').insertOne(저장할거);
        res.send('대댓글저장');
    } catch (e) {
        console.log(e)
        res.status(500).send('서버에러')
    }
})

router.put('/like', async (req, res) => {
    db.collection('post').updateOne({ _id: new ObjectId(req.body.postid) }, { $inc: { like: 1 } }).then(() => {
        res.send('success');
    })
})

module.exports = router