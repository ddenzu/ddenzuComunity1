function verify(req, res, next) {
    if (req.user) {
        return next();
    } else {
        // 프론트에서 fetch 요청을 하는 경우 
        // 프론트의 js 에서 로그인 에러핸들링을 하고 있지만
        // fetch 요청을 하지 않고 새로운 페이지를 로드하는 과정에서
        // 서버의 상태코드를 받기 애매하기 때문에 스크립트 태그를 리턴
        return res.status(401).send(`
            <script>
                if (confirm('로그인 페이지로 이동하시겠습니까?')) {
                    window.location.replace('/log');
                } else {
                    window.history.back();
                }
            </script>
        `);
    }
}

module.exports = verify;