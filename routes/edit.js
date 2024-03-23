const router = require('express').Router()
const { ObjectId } = require('mongodb')
let connectDB = require('../utils/database.js')
let verify = require('../utils/verify.js')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

router.get('/:id', verify, async (req, res) => {
    try {
        const result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) })
        if (!result) {
            return res.status(404).send('게시글을 찾을 수 없음');
        }
        res.render('edit.ejs', { result });
    } catch (error) {
        console.log(error);
        res.status(500).send('서버 에러');
    }
})

router.put('', async (req, res) => {
    try {
        let 아이디비교용 = JSON.stringify(req.body.userId)
        if (아이디비교용 === JSON.stringify(req.user._id)) {
            const updatedPost = {
                title: req.body.title,
                content: req.body.content
            };
            await db.collection('post').updateOne({ _id: new ObjectId(req.body.id) }, { $set: updatedPost })
            res.redirect('/list/1');
        }
        else {
            res.send("<script>alert('수정할 수 없슴다');window.location.replace(`/list/1`)</script>");
        }
    } catch (e) {
        console.log(e);
        res.status(500).send('서버 에러');
    }
})

module.exports = router