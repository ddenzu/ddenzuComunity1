const router = require('express').Router()
const { ObjectId } = require('mongodb')
let connectDB = require('../utils/database.js')
const verify = require('../utils/verify.js')
const serverError = require('../utils/error.js')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

// 게시글 수정 페이지
router.get('/:id', verify, async (req, res) => {
    try {
        const isRead = req.user ? req.user.isRead : true;
        const editPost = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) })
        if (!editPost) {
            return res.status(404).send('게시글이 db에 존재하지 않음');
        }
        return res.render('edit.ejs', { result:editPost, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

// 게시글 제목 or 내용 변경
router.put('', async (req, res) => {
    try {
        if (req.body.title.length > 20){
            return res.status(400).send('제목이 20자 초과임');
        }
        const originalWriter = JSON.stringify(req.body.userId)
        if (originalWriter === JSON.stringify(req.user._id)) {
            const updatedPost = {
                title: req.body.title,
                content: req.body.content
            };
            await db.collection('post').updateOne({ _id: new ObjectId(req.body.id) }, { $set: updatedPost })
            return res.redirect('/list/1');
        }
        else {
            return res.status(403).send("본인이 작성한 글이 아님");
        }
    } catch (err) {
        serverError(err, res)
    }
})

module.exports = router