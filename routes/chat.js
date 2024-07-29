const router = require('express').Router()
const { ObjectId } = require('mongodb')
let connectDB = require('../utils/database.js')
const verify = require('../utils/verify.js')
const serverError = require('../utils/error.js')
const dateFormat1 = require("./../public/time.js");
const updateLocation = require('../utils/location.js')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

// 채팅방의 상대방 리스트 만들기
function getCounterpart(chatrooms, username) {
    const counterpart = [];
    chatrooms.forEach(obj => {
        obj.name.forEach(nameElement => {
            if (nameElement !== username) { 
                counterpart.push(nameElement);
            }
        });
    });
    return counterpart;
}

// 메세지 전송
router.post('/messages', verify, async function (req, res) { 
    try {
        if (!req.body.content) {
            return res.status(400).send("메세지 내용이 없음");
        };
        const messageData = {
            parent: req.body.parent, // 채팅방의 id
            content: req.body.content, 
            userid: req.user._id, // 채팅 발신자 id
            date: dateFormat1.dateFormat(new Date()),
        };
        const result = await db.collection('message').insertOne(messageData);
        if (result) {
            const receiver = await db.collection('chatroom')
                .findOne({ _id: new ObjectId(req.body.parent) })
                .then(data => data.name.filter(name => name !== req.user.username));
            // 수신자가 chatroom 에 없다면 안읽음 표시
            if (await db.collection('user').findOne({ username: receiver[0], location: { $ne: "chatroom" } })) {
                await db.collection('user').updateOne(
                    { username: receiver[0] }, 
                    { $set: { isRead: false } } 
                );
            }
            return res.status(200).send('메세지 저장 성공');
        } else {
            return res.status(500).send("서버 오류");
        }
    } catch (err) {
        serverError(err, res) 
    }
})

// 몽고db chage stream
router.get('/messages/:id', verify, function (req, res) {
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    });
    db.collection('message').find({ parent: req.params.id }).toArray().then((result) => {
        res.write('event: test\n');
        res.write('data: ' + JSON.stringify(result) + '\n\n');
    })
    const 찾을문서 = [
        { $match: { 'fullDocument.parent': req.params.id } }
    ];
    const changeStream = db.collection('message').watch(찾을문서);
    changeStream.on('change', result => {
        var 추가된문서 = [result.fullDocument];
        res.write('event: test\n');
        res.write('data: ' + JSON.stringify(추가된문서) + '\n\n');
    });
});

// 채팅방 삭제
router.delete('', verify, async (req, res) => {
    try {
        if (!req.body.삭제id) {
            return res.status(400).send('삭제할 채팅방의 ID가 존재하지 않음');
        }
        await Promise.all([
            db.collection('chatroom').deleteOne({ _id: new ObjectId(req.body.삭제id) }),
            db.collection('message').deleteMany({ parent: req.body.삭제id })
        ]);
        const chatroomList = await db.collection('chatroom').find({ member: req.user._id }).toArray();
        const isRead = req.user ? req.user.isRead : true;
        const counterpart = getCounterpart(chatroomList, req.user.username)
        return res.render('chat.ejs', { data: chatroomList, cur: req.user._id, arrow: 0, counterpart, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

// 상대방과 직접 채팅을 시작하거나 상대방의 프로필 사진을 클릭하여 채팅을 시작했을 때
router.get('/matches', verify, async function (req, res) { 
    try {
        if (req.query.name == req.user.username) {
            return res.send("<script>window.location.replace('/chat')</script>");
        }
        const result = await db.collection('chatroom').findOne({ name: { $all: [req.user.username, req.query.name] } })
        if (result == null) {
            const roomData = {
                receiver: req.query.name,
                sender: req.user.username,
                member: [new ObjectId(req.query.id), req.user._id],
                name: [req.query.name, req.user.username],
                date: new Date()
            }
            await db.collection('chatroom').insertOne(roomData)
        }
        const [chatroomList, curCounterpart, isRead] = await Promise.all([
            db.collection('chatroom').find({ member: req.user._id }).toArray(),
            db.collection('chatroom').findOne({ name: { $all: [req.user.username, req.query.name] } }),
            updateLocation(req, 'chatroom', true) 
        ]);
        const counterpart = getCounterpart(chatroomList, req.user.username)
        return res.render('chat.ejs', { data: chatroomList, cur: req.user._id, arrow: curCounterpart._id, counterpart, isRead })
    } catch (err) {
        serverError(err, res)
    }
})

// 네이게이션바에서 chatroom을 클릭했을 때
router.get('', verify, async function (req, res) { 
    try {
        const [isRead, chatroomList] = await Promise.all([
            updateLocation(req, 'chatroom', true), 
            db.collection('chatroom').find({ member: req.user._id }).toArray() 
        ]);
        const counterpart = getCounterpart(chatroomList, req.user.username)
        return res.render('chat.ejs', { data: chatroomList, cur: req.user._id, arrow: 0, counterpart, isRead });
    } catch (err) {
        serverError(err, res)
    }
});


module.exports = router