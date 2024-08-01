const router = require('express').Router()
const verify = require('../middlewares/verify.js')
const chatController = require('../controllers/chatController');

router.get('', verify, chatController.getChatroom); // 네이게이션바에서 chatroom 조회
router.get('/matches', verify, chatController.startChat); // 채팅 상대 매칭
router.post('/messages/:chatroomId', verify, chatController.postMessage);// 메세지 발신
router.get('/messages/:chatroomId', verify, chatController.getMessages);// 실시간 메세지 수신(chage stream)
router.delete('/:chatroomId', verify, chatController.deleteChatroom);// 채팅방 삭제

module.exports = router