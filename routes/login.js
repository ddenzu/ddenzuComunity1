const router = require('express').Router()
const passport = require('../utils/auth.js');

router.get('', async (req, res) => {
    res.render('login.ejs')
})

router.post('', async (req, res, next) => {
    try{
        passport.authenticate('local', (error, user, info) => { // auth 의 검사함수 사용
            if (error) return res.status(500).json(error) // 에러날때
            if (!user) return res.status(401).json(info.message) // db에 없을때
            req.logIn(user, (err) => { // 세션만들기 실행
                if (err) return next(err)
                res.redirect('/list/1') // 성공했을때
            })
        })(req, res, next)
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '서버 에러' });
    }
})

module.exports = router
