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
    try{
        const isRead = req.user ? req.user.isRead : true;
        return res.render('login.ejs', {isRead})
    } catch(err){
        serverError(err, res)
    }
})

// 로그인 시도
router.post('/login', async (req, res, next) => {
    try{
        if(!req.body.username || !req.body.password){
            return res.status(400).send('아이디 또는 비밀번호를 입력하지 않음')
        }
        passport.authenticate('local', (error, user, info) => { // auth 의 검사함수 사용
            if (error) return res.status(500).json(error) 
            if (!user) return res.status(401).send(`${info.message}`); // db에 없을때
            req.logIn(user, (err) => { // 세션만들기 실행
                if (err) return next(err)
                return res.status(200).send('로그인 성공') 
            })
        })(req, res, next)
    } catch (err) {
        serverError(err, res)
    }
})

// 로그아웃
router.get('/logout', function (req, res, next) {
    try{
        req.session.destroy((err) => {
            if (err) {
                serverError(err, res);
                return;
            }
            return res.redirect('/list/1');
        }); 
    } catch(err) {
        serverError(err, res);
    }
});

// 사용자의 현재 위치정보 저장
router.put('/locations', async (req, res) => { 
    if(!req.user){ 
        return
    }
    try {
        if (!req.body) {
            return res.status(400).send("위치정보 없음");
        }
        await updateLocation(req, req.body.content)
        return res.status(200).send('위치 업데이트');
    } catch (err) {
        serverError(err, res);
    }
});

module.exports = router
