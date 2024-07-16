const router = require('express').Router()
const { ObjectId } = require('mongodb')
const requestIp = require('request-ip')
const serverError = require('../utils/error.js')
let connectDB = require('../utils/database.js')
const verify = require('../utils/verify.js')
const dateFormat1 = require("./../public/time.js");
const updateLocation = require('../utils/location.js')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

router.get('/:id', async (req, res) => {
    try {
        const result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) })
        if (!result) {
            return res.status(404).send("<script>alert('게시글이 존재하지 않습니다.');window.location.replace(`/list/1`)</script>")
        }
        const result2 = await db.collection('comment').find({ postId: new ObjectId(req.params.id), parentId: null }).toArray()
        const result3 = await db.collection('user').findOne({ _id: result.작성자_id })
        const result4 = await db.collection('comment').find({ postId: new ObjectId(req.params.id), parentId: { $exists: true } }).toArray()
        const 현재접속자 = req.user ? req.user.username : 'noUser';
        const 이미지주소 = Array.isArray(result.imgName) ? result.imgName : (result.imgName ? [result.imgName] : []);
        const 동영상주소 = Array.isArray(result.vidName) ? result.vidName : (result.vidName ? [result.vidName] : []);
        const 프로필 = result3.imgName ? result3.imgName : '';
        const isRead = await updateLocation(req, 'detail')
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
    catch (err) {
        serverError(err, res)
    }
})

router.post('/comment', verify, async (req, res) => {
    try {
        if (!req.body.content) {
            return res.status(400).send("댓글등록 실패"); // 잘못된 요청
        }
        const commentData = {
            postId: new ObjectId(req.body.parent), // 작성글 id
            content: req.body.content, // 채팅내용
            username: req.user.username,
            userId: req.user._id,
            userprofile: req.user.imgName,
            date: new Date(),
        };
        await db.collection('comment').insertOne(commentData);
        res.send('댓글저장');
    } catch (err) {
        serverError(err, res)
    }
})

router.delete('/comment', verify, async (req, res) => {
    try {
        const 비교1 = JSON.stringify(req.user._id)
        const 비교2 = JSON.stringify(req.body.userId)
        if (비교1 == 비교2) {
            const deletedComment = await db.collection('comment').deleteOne({ _id: new ObjectId(req.body.id) })
            if (deletedComment) {
                return res.send('success');
            } else {
                return res.status(404).send("fail");
            }
        } else {
            return res.status(403).send("fail");
        }
    } catch (err) {
        serverError(err, res)
    }
})

router.post('/recomment', verify, async (req, res) => {
    try {
        if (!req.body.content) {
            return res.status(400).send("<script>alert('대댓글등록 실패');</script>");
        }
        const recommentData = {
            postId: new ObjectId(req.body.parent), // 작성글 id
            parentId: new ObjectId(req.body.reparent),
            content: req.body.content, // 채팅내용
            username: req.user.username,
            userId: req.user._id,
            userprofile: req.user.imgName,
            date: new Date(),
        }
        await db.collection('comment').insertOne(recommentData);
        res.send('대댓글저장');
    } catch (err) {
        serverError(err, res)
    }
})

router.put('/like', async (req, res) => {
    db.collection('post').updateOne({ _id: new ObjectId(req.body.postid) }, { $inc: { like: 1 } }).then(() => {
        res.send('success');
    })
})

module.exports = router