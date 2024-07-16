const router = require('express').Router()
const passport = require('../utils/auth.js');
const verify = require('../utils/verify.js')
const serverError = require('../utils/error.js')
let connectDB = require('../utils/database.js')
const updateLocation = require('../utils/location.js')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

router.get('', async (req, res) => {
    const isRead = req.user ? req.user.isRead : true;
    res.render('login.ejs', {isRead})
})

router.post('/login', async (req, res, next) => {
    try{
        passport.authenticate('local', (error, user, info) => { // auth 의 검사함수 사용
            if (error) return res.status(500).json(error) // 에러날때
            if (!user) return res.status(401).send(`<script>alert("${info.message}");history.go(-1)</script>`); // db에 없을때
            req.logIn(user, (err) => { // 세션만들기 실행
                if (err) return next(err)
                res.redirect('/list/1') // 성공했을때
            })
        })(req, res, next)
    } catch (err) {
        serverError(err, res)
    }
})

router.get('/logout', function (req, res) {
    req.session.destroy((err) => {
        if (err) {
            serverError(err, res);
            return;
        }
        res.redirect('/list/1');
    });
});

router.put('/locations', verify, async (req, res) => { 
    try {
        if (!req.body) {
            return res.status(400).send("위치정보 없음");
        }
        await updateLocation(req, req.body.content)
        res.send('위치 업데이트');
    } catch (err) {
        serverError(err, res);
    }
});

module.exports = router
