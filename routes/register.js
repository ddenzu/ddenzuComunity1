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
    try{
        const isRead = req.user ? req.user.isRead : true;
        return res.render('register.ejs', {isRead})
    } catch(err){
        serverError(err, res)
    }
})

router.post('', async (req, res) => {
    try {
        if (req.body.username.length > 15 || req.body.password.length > 15) {
            return res.status(400).send("아이디 또는 비밀번호가 15자를 초과함");
        }
        const result = await db.collection('user').findOne({ username: req.body.username });
        if (result) {
            return res.status(409).send("이미 존재하는 아이디");
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10) // 10 이면 적당
        await db.collection('user').insertOne({ username: req.body.username, password: hashedPassword });
        return res.status(200).send('가입 성공')
    } catch (err) {
        serverError(err, res)
    }
})

module.exports = router