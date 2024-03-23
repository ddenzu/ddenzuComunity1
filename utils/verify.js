function verify(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.send("<script>alert('로그인 요망');window.location.replace(`/login`)</script>");
    }
}

module.exports = verify;