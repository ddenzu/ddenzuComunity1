const chatModel = require('../models/chatModel');
const userModel = require('../models/userModel');
const serverError = require('../utils/error');
const getCounterpart = require('../utils/counterpart.js')
const dateFormat1 = require("./../public/time.js");
const { ObjectId } = require('mongodb');

exports.postMessage = async (req, res) => {
    try {
        if (!req.body.content) {
            return res.status(400).send("메세지 내용이 없음");
        }
        const messageData = {
            parent: req.params.chatroomId, 
            content: req.body.content,
            userid: req.user._id, 
            date: dateFormat1.dateFormat(new Date()),
        };
        const result = await chatModel.insertMessage(messageData);
        if (result) {
            const receiver = await chatModel.findReceiver(req.params.chatroomId, req.user.username);
            if (await userModel.findUserLocation(receiver[0], "chatroom")) { // 수신자 위치가 챗룸이 아니면
                await chatModel.updateUserReadStatus(receiver[0], false); // 메세지 안읽음 처리
            }
            return res.status(200).send('메세지 저장 성공');
        } else {
            return res.status(500).send("서버 오류");
        }
    } catch (err) {
        serverError(err, res);
    }
};

exports.getMessages = (req, res) => {
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    });
    chatModel.findMessages(req.params.chatroomId).then((result) => {
        res.write('event: test\n');
        res.write('data: ' + JSON.stringify(result) + '\n\n');
    });
    const changeStream = chatModel.watchMessages(req.params.chatroomId);
    changeStream.on('change', result => {
        var 추가된문서 = [result.fullDocument];
        res.write('event: test\n');
        res.write('data: ' + JSON.stringify(추가된문서) + '\n\n');
    });
};

exports.deleteChatroom = async (req, res) => {
    try {
        if (!req.params.chatroomId) {
            return res.status(400).send('삭제할 채팅방의 ID가 존재하지 않음');
        }
        await Promise.all([
            chatModel.deleteChatroom(req.params.chatroomId),
            chatModel.deleteMessages(req.params.chatroomId)
        ]);
        const chatroomList = await chatModel.findChatrooms(req.user._id);
        const isRead = req.user ? req.user.isRead : true;
        const counterpart = getCounterpart(chatroomList, req.user.username);
        return res.render('chat/chat.ejs', { data: chatroomList, cur: req.user._id, arrow: 0, counterpart, isRead });
    } catch (err) {
        serverError(err, res);
    }
};

exports.startChat = async (req, res) => {
    try {
        if (req.query.name == req.user.username) {
            return res.send("<script>window.location.replace('/chat')</script>");
        }
        const result = await chatModel.findChatroom([req.user.username, req.query.name]);
        if (result == null) {
            const roomData = {
                receiver: req.query.name,
                sender: req.user.username,
                member: [new ObjectId(req.query.id), req.user._id],
                name: [req.query.name, req.user.username],
                date: new Date()
            };
            await chatModel.createChatroom(roomData);
        }
        const [chatroomList, curCounterpart, isRead] = await Promise.all([
            chatModel.findChatrooms(req.user._id),
            chatModel.findChatroom([req.user.username, req.query.name]),
            userModel.updateLocation(req, 'chatroom', true)
        ]);
        const counterpart = getCounterpart(chatroomList, req.user.username);
        return res.render('chat/chat.ejs', { data: chatroomList, cur: req.user._id, arrow: curCounterpart._id, counterpart, isRead });
    } catch (err) {
        serverError(err, res);
    }
};

exports.getChatroom = async (req, res) => {
    try {
        const [isRead, chatroomList] = await Promise.all([
            userModel.updateLocation(req, 'chatroom', true),
            chatModel.findChatrooms(req.user._id)
        ]);
        const counterpart = getCounterpart(chatroomList, req.user.username);
        return res.render('chat/chat.ejs', { data: chatroomList, cur: req.user._id, arrow: 0, counterpart, isRead });
    } catch (err) {
        serverError(err, res);
    }
};