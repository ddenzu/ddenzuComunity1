const router = require('express').Router()
const upload = require('../utils/upload.js')
const verify = require('../middlewares/verify.js')
const userController = require('../controllers/userController');

//users api
router.get('/register', userController.getRegisterPage); // 회원가입 페이지 조회
router.post('/register', userController.registerUser); // 회원가입
router.get('/login', userController.getLoginPage); // 로그인 페이지 조회
router.post('/login', userController.loginUser); // 로그인
router.get('/logout', userController.logoutUser); // 로그아웃
router.get('/mypage', verify, userController.getMyPage); // 마이페이지 조회
router.put('/mypage/name', userController.updateUsername); // 이름 업데이트
router.put('/mypage/profile-image', upload.single('img1'), userController.updateProfileImage); // 프로필 사진 업데이트
router.put('/locations', userController.updateLocation); // 위치 업데이트

module.exports = router