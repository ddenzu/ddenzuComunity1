const router = require('express').Router()
let connectDB = require('../utils/database.js')
const bcrypt = require('bcrypt')
const serverError = require('../utils/error.js')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

router.get('', async (req, res) => {
    const isRead = req.user ? req.user.isRead : true;
    res.render('register.ejs', {isRead})
})

router.post('', async (req, res) => {
    try {
        if (req.body.username.length > 20 || req.body.password.length > 20) {
            return res.status(400).send("<script>alert('아이디 또는 비밀번호는 20글자 이하로 지정해주세요.');window.location.replace(location.href);</script>");
        }
        const result = await db.collection('user').findOne({ username: req.body.username });
        if (result) {
            return res.status(409).send("<script>alert('이미 존재하는 아이디입니다');location.replace(location.href);</script>");
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10) // 10 이면 적당
        await db.collection('user').insertOne({ username: req.body.username, password: hashedPassword });
        return res.redirect('/list/1')
    } catch (err) {
        serverError(err, res)
    }
})

module.exports = router