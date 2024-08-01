function verify(req, res, next) {
    if (req.user) {
        return next();
    } else {
        return res.status(401).send(`
            <script>
                if (confirm('로그인 페이지로 이동하시겠습니까?')) {
                    window.location.replace('/users/login');
                } else {
                    window.history.back();
                }
            </script>
        `);
    }
}

module.exports = verify;