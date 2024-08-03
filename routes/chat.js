const router = require('express').Router()
const verify = require('../middlewares/verify.js')
const chatController = require('../controllers/chatController');

//chat api
router.get('', verify, chatController.getChatroom); // 네이게이션바에서 채팅방 조회
router.get('/start', verify, chatController.startChat); // 상대방과 바로 채팅 시작
router.post('/:chatroomId/messages', verify, chatController.postMessage);// 메세지 발신
router.get('/:chatroomId/messages', verify, chatController.getMessages);// 실시간 메세지 수신(chage stream)
router.delete('/:chatroomId', verify, chatController.deleteChatroom);// 채팅방 삭제

module.exports = router