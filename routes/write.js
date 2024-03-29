const router = require('express').Router()
let connectDB = require('../utils/database.js')
let verify = require('../utils/verify.js')
let upload = require('../utils/upload.js')
const dateFormat1 = require("./../public/time.js");

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

router.get('', verify, async (req, res) => {
    try {
        let result = await db.collection('user').findOne({ username: req.user.username });
        if (req.user.username == result.username) {
            res.render('write.ejs');
        } else {
            res.status(401).send("<script>alert('로그인 요망');window.location.replace(`/login`)</script>");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('서버 에러');
    }
});

router.post('', upload.array('img1'), async (req, res) => {
    try {
        if (req.body.title === "" || req.body.content === "") {
            return res.status(400).send('내용이 존재하지 않습니다');
        }
        if (req.body.title.length > 20){
            return res.status(400).send("<script>alert('제목을 20글자 이하로 지정해주세요.');history.go(-1)</script>");
        }
        const postDetails = {
            title: req.body.title,
            content: req.body.content,
            작성자_id: req.user._id,
            작성자: req.user.username,
            like: 0,
            date: dateFormat1.dateFormat(new Date())
        };
        if (req.files.length === 0) { // 이미지 또는 동영상이 없을 때
            await db.collection('post').insertOne(postDetails);
        } else {
            const imgNames = [];
            const vidNames = [];
            for (const file of req.files) {
                if (file.mimetype === 'video/mp4' || file.mimetype === 'video/quicktime') {
                    vidNames.push(file.key);
                } else {
                    imgNames.push(file.key);
                }
            }
            if (imgNames.length > 0) {
                postDetails.imgName = imgNames;
            }
            if (vidNames.length > 0) {
                postDetails.vidName = vidNames;
            }
            await db.collection('post').insertOne(postDetails);
        }
        res.redirect('/list/1');
    } catch (e) {
        console.error(e);
        res.status(500).send('서버에러');
    }
});

module.exports = router