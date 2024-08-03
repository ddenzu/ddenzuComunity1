const serverError = require('../utils/error.js')
const passport = require('../middlewares/passport.js');
const userModel = require('../models/userModel');


// 회원가입 페이지 조회
exports.getRegisterPage  = async (req, res) => {
    try {
        const isRead = req.user ? req.user.isRead : true;
        return res.render('users/register.ejs', { isRead });
    } catch (err) {
        serverError(err, res);
    }
};

// 회원가입
exports.registerUser = async (req, res) => {
    try {
        if (req.body.username.length > 15 || req.body.password.length > 15) {
            return res.status(400).send("아이디 또는 비밀번호가 15자를 초과함");
        }
        const result = await userModel.findUserByUsername(req.body.username); 
        if (result) {
            return res.status(409).send("이미 존재하는 아이디");
        }
        const hashedPassword = await userModel.hashPassword(req.body.password);
        await userModel.insertUser({ username: req.body.username, password: hashedPassword }); 
        return res.status(200).send('가입 성공');
    } catch (err) {
        serverError(err, res);
    }
};

// 로그인 페이지 조회
exports.getLoginPage = async (req, res) => {
    try {
        const isRead = req.user ? req.user.isRead : true;
        return res.render('users/login.ejs', { isRead });
    } catch (err) {
        serverError(err, res);
    }
};

// 로그인
exports.loginUser = async (req, res, next) => {
    try {
        if (!req.body.username || !req.body.password) {
            return res.status(400).send('아이디 또는 비밀번호를 입력하지 않음');
        }
        passport.authenticate('local', (error, user, info) => { 
            if (error) return res.status(500).json(error);
            if (!user) return res.status(401).send(`${info.message}`); 
            req.logIn(user, (err) => { // 세션만들기 실행
                if (err) return next(err);
                return res.status(200).send('로그인 성공');
            });
        })(req, res, next);
    } catch (err) {
        serverError(err, res);
    }
};

// 로그아웃
exports.logoutUser = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                serverError(err, res);
                return;
            }
            return res.redirect('/posts/pages/1');
        });
    } catch (err) {
        serverError(err, res);
    }
};

// 마이페이지 조회
exports.getMyPage = async (req, res) => {
    try {
        const [isRead, user] = await Promise.all([
            userModel.updateLocation(req, 'mypage'),
            userModel.findUserByUsername(req.user.username),
        ]);
        return res.render('users/mypage.ejs', { 아이디: user, isRead });
    } catch (err) {
        serverError(err, res);
    }
};

// 사용자 이름 업데이트
exports.updateUsername = async (req, res) => {
    try {
        if (req.body.username.length > 15) {
            return res.status(400).send('아이디가 15글자를 초과');
        }
        const result = await userModel.findUserByUsername(req.body.username);
        if (result) {
            return res.status(409).send("이미 존재하는 아이디");
        }
        const beforeUsername = req.user.username;
        await userModel.updateUsername(req.user._id, req.body.username);
        await Promise.all([
            userModel.updateUsernamesInComments(req.user._id, req.body.username),
            userModel.updatePostsUsername(req.user._id, req.body.username),
            userModel.updateChatroomReceiver(beforeUsername, req.body.username),
            userModel.updateChatroomSender(beforeUsername, req.body.username),
            userModel.updateChatroomNames(beforeUsername, req.body.username),
        ]);
        return res.status(200).send("닉네임 변경 성공");
    } catch (err) {
        serverError(err, res);
    }
};

// 사용자 프로필 사진 업데이트
exports.updateProfileImage = async (req, res) => {

    try {
        await Promise.all([
            userModel.updateUserProfileImage(req.user._id, req.file.key),
            userModel.updateUserprofileInComments(req.user._id, req.file.key),
        ]);
        return res.status(200).send("프로필 사진 변경 성공");
    } catch (err) {
        serverError(err, res);
    }
};

// 사용자 위치 업데이트
exports.updateLocation = async (req, res) => {
    if (!req.user) {
        return;
    }
    try {
        if (!req.body) {
            return res.status(400).send("위치정보 없음");
        }
        await userModel.updateLocation(req, req.body.content);
        return res.status(200).send('위치 업데이트');
    } catch (err) {
        serverError(err, res);
    }
};