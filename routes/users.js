const router = require('express').Router()
const upload = require('../utils/upload.js')
const verify = require('../utils/verify.js')
const userController = require('../controllers/userController');

// /users api
router.get('/register', userController.getRegisterPage);
router.post('/register', userController.registerUser);
router.get('/login', userController.getLoginPage);
router.post('/login', userController.loginUser);
router.get('/logout', userController.logoutUser);
router.put('/locations', userController.updateLocation);
router.get('/mypage', verify, userController.getMyPage);
router.put('/mypage/name', userController.updateUsername);
router.put('/mypage/profile-image', upload.single('img1'), userController.updateProfileImage);

module.exports = router