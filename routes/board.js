var router = require('express').Router();

function checkLogin(요청, 응답, next) {
    if (요청.user) {
        next()
    }
    else {
        응답.send('로그인 하삼')
    }
}

router.use(checkLogin);
// router.use('/sports', checkLogin);

router.get('/sports', function(요청, 응답){
    응답.send('스포츠 게시판');
});
 
router.get('/game', function(요청, 응답){
    응답.send('게임 게시판');
}); 
module.exports = router;

// 유지보수성 향상