const router = require('express').Router()
const verify = require('../utils/verify.js')
const chatController = require('../controllers/chatController');

// 메세지 전송
router.post('/messages', verify, chatController.postMessage);

// 몽고db chage stream
router.get('/messages/:id', verify, chatController.getMessages);

// 채팅방 삭제
router.delete('', verify, chatController.deleteChatroom);

// 상대방과 직접 채팅을 시작하거나 상대방의 프로필 사진을 클릭하여 채팅을 시작했을 때
router.get('/matches', verify, chatController.startChat);

// 네이게이션바에서 chatroom을 클릭했을 때
router.get('', verify, chatController.getChatroom);

module.exports = router