const router = require('express').Router()
let connectDB = require('../utils/database.js')
const bcrypt = require('bcrypt')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

router.get('', async (req, res) => {
    res.render('register.ejs')
})

router.post('', async (req, res) => {
    try {
        if (req.body.username.length > 20) {
            return res.send("<script>alert('아이디는 20글자 이하로 지정해주세요.');window.location.replace(location.href);</script>");
        }
        let result = await db.collection('user').findOne({ username: req.body.username });
        if (result) {
            return res.send("<script>alert('이미 존재하는 아이디입니다');location.replace(location.href);</script>");
        }
        let 해시 = await bcrypt.hash(req.body.password, 10) // 10 이면 적당히 꼬은거
        await db.collection('user').insertOne({ username: req.body.username, password: 해시 });
        return res.redirect('/list/1')
    } catch (e) {
        console.error(e);
        return res.status(500).send('서버 에러');
    }
})

module.exports = router