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

router.get('/:id', verify, async (req, res) => {
    try {
        const isRead = req.user ? req.user.isRead : true;
        const result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) })
        if (!result) {
            return res.status(404).send('게시글을 찾을 수 없음');
        }
        res.render('edit.ejs', { result, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

router.put('', async (req, res) => {
    try {
        if (req.body.title.length > 20){
            return res.status(400).send("<script>alert('제목을 20글자 이하로 지정해주세요.');history.go(-1);</script>");
        }
        const originalWriter = JSON.stringify(req.body.userId)
        if (originalWriter === JSON.stringify(req.user._id)) {
            const updatedPost = {
                title: req.body.title,
                content: req.body.content
            };
            await db.collection('post').updateOne({ _id: new ObjectId(req.body.id) }, { $set: updatedPost })
            res.redirect('/list/1');
        }
        else {
            res.status(403).send("<script>alert('수정할 수 없습니다');window.location.replace(`/list/1`)</script>");
        }
    } catch (err) {
        serverError(err, res)
    }
})

module.exports = router