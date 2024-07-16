function verify(req, res, next) {
    if (req.user) {
        next();
    } else {
        return res.status(401).send("<script>alert('로그인 요망');window.location.replace(`/log`)</script>");
    }
}

module.exports = verify;