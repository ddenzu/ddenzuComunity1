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

router.post('/messages', verify, async function (req, res) { 
    try {
        if (!req.body.content) {
            return res.status(400).send("메세지 전송 실패");
        };
        const messageData = {
            parent: req.body.parent, // 채팅방의 id
            content: req.body.content, // 채팅 내용
            userid: req.user._id, // 채팅 발신자 id
            date: dateFormat1.dateFormat(new Date()),
        };
        const result = await db.collection('message').insertOne(messageData);
        if (result) {
            const receiver = await db.collection('chatroom').findOne({ _id: new ObjectId(req.body.parent) }).
                then(data => data.name.filter(name => name !== req.user.username));

            // 수신자가 chatroom 에 없다면 isRead: false 설정으로 안읽음 표시
            if (await db.collection('user').findOne({ username: receiver[0], location: { $ne: "chatroom" } })) {
                await db.collection('user').updateOne(
                    { username: receiver[0] }, // username이 receiver[0]와 일치하는 문서를 찾음
                    { $set: { isRead: false } } // 해당 문서에 isRead 컬럼을 추가하고 false로 설정
                );
            }
            return res.send('성공');
        }
        else {
            return res.send("채팅 메시지를 저장하는데 문제가 발생함");
        }
    } catch (err) {
        serverError(err, res)
    }
})

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

router.delete('', verify, async (req, res) => {
    try {
        if (!req.body.삭제id) {
            return res.status(400).send('삭제할 ID가 존재하지 않음');
        }
        await db.collection('chatroom').deleteOne({ _id: new ObjectId(req.body.삭제id) });
        await db.collection('message').deleteMany({ parent: req.body.삭제id });
        const isRead = req.user ? req.user.isRead : true;
        const result1 = await db.collection('chatroom').find({ member: req.user._id }).toArray();
        const counterpart = [];
        result1.forEach(obj => {
            obj.name.forEach(nameElement => {
                if (nameElement !== req.user.username) {
                    counterpart.push(nameElement);
                }
            });
        });
        return res.render('chat.ejs', { data: result1, cur: req.user._id, arrow: 0, counterpart, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

router.get('/matches', verify, async function (req, res) { // 직접 매칭했을 때
    try {
        if (req.query.name == req.user.username) {
            return res.send("<script>window.location.replace('/chat')</script>");
        }
        const isRead = await updateLocation(req, 'chatroom', true) 
        let result = await db.collection('chatroom').findOne({ name: { $all: [req.user.username, req.query.name] } })
        if (result == null) {
            var roomData = {
                receiver: req.query.name,
                sender: req.user.username,
                member: [new ObjectId(req.query.id), req.user._id],
                name: [req.query.name, req.user.username],
                date: new Date()
            }
            await db.collection('chatroom').insertOne(roomData)
        }
        const result1 = await db.collection('chatroom').find({ member: req.user._id }).toArray()
        const result2 = await db.collection('chatroom').findOne({ name: { $all: [req.user.username, req.query.name] } })
        const counterpart = [];
        result1.forEach(obj => {
            obj.name.forEach(nameElement => {
                if (nameElement !== req.user.username) {
                    counterpart.push(nameElement);
                }
            });
        });
        res.render('chat.ejs', { data: result1, cur: req.user._id, arrow: result2._id, counterpart: counterpart, isRead })
    } catch (err) {
        serverError(err, res)
    }
})

router.get('', verify, async function (req, res) { // navbar에서 올 때
    try {
        const isRead = await updateLocation(req, 'chatroom', true) // 최신 isRead 를 가져오기 위해
        const result = await db.collection('chatroom').find({ member: req.user._id }).toArray();
        const counterpart = [];
        result.forEach(obj => {
            obj.name.forEach(nameElement => {
                if (nameElement !== req.user.username) {
                    counterpart.push(nameElement);
                }
            });
        });
        res.render('chat.ejs', { data: result, cur: req.user._id, arrow: 0, counterpart: counterpart, isRead });
    } catch (err) {
        serverError(err, res)
    }
});


module.exports = router