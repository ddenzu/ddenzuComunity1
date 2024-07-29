const router = require('express').Router()
const { ObjectId } = require('mongodb')
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

// 게시글을 클릭하여 게시글의 세부사항 페이지 로드
router.get('/:id', async (req, res) => {
    try {
        const result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) })
        if (!result) {
            return res.status(404).send("<script>alert('게시글이 존재하지 않습니다.');window.location.replace(`/list/1`)</script>")
        }
        const [comments, result2, reComments, isRead] = await Promise.all([
            db.collection('comment').find({ postId: new ObjectId(req.params.id), parentId: null }).toArray(),
            db.collection('user').findOne({ _id: result.작성자_id }),
            db.collection('comment').find({ postId: new ObjectId(req.params.id), parentId: { $exists: true } }).toArray(),
            updateLocation(req, 'detail')
        ]);
        const imageUrl = Array.isArray(result.imgName) ? result.imgName : (result.imgName ? [result.imgName] : []);
        const vidUrl = Array.isArray(result.vidName) ? result.vidName : (result.vidName ? [result.vidName] : []);
        const profile = result2.imgName ? result2.imgName : '';
        return res.render('detail.ejs', {
            글목록: result,
            댓글목록: comments,
            이미지주소: imageUrl,
            프로필: profile,
            동영상주소: vidUrl,
            dateFormat1,
            대댓글: reComments,
            isRead
        });
    }
    catch (err) {
        serverError(err, res)
    }
})

// 게시글에 댓글을 기재
router.post('/comments', verify, async (req, res) => {
    try {
        if (!req.body.content) {
            return res.status(400).send("댓글내용이 존재하지 않음"); 
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
        return res.status(200).send("댓글 저장 성공");
    } catch (err) {
        serverError(err, res)
    }
})

// 게시글의 댓글을 삭제
router.delete('/comments', verify, async (req, res) => {
    try {
        const compare1 = JSON.stringify(req.user._id)
        const compare2 = JSON.stringify(req.body.userId)
        if (compare1 == compare2) {
            const deletedComment = await db.collection('comment').deleteOne({ _id: new ObjectId(req.body.id) })
            if (deletedComment) {
                return res.status(200).send('댓글 삭제 성공');
            } else {
                return res.status(404).send("db에 삭제할 댓글이 존재하지 않음");
            }
        } else {
            return res.status(403).send("본인이 작성한 댓글이 아님");
        }
    } catch (err) {
        serverError(err, res)
    }
})

// 댓글에 대댓글을 기재
router.post('/recomments', verify, async (req, res) => {
    try {
        if (!req.body.content) {
            return res.status(400).send("대댓글내용이 존재하지 않음");
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
        return res.status(200).send('대댓글 저장 성공');
    } catch (err) {
        serverError(err, res)
    }
})

// 좋아요 + 1
router.put('/like', async (req, res) => {
    try {
        db.collection('post').updateOne({ _id: new ObjectId(req.body.postid) }, { $inc: { like: 1 } }).then(() => {
            return res.status(200).send('좋아요 + 1 성공');
        })
    } catch (err) {
        serverError(err, res)
    }
})

module.exports = router