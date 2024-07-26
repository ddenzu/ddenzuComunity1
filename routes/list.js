const router = require('express').Router()
const { ObjectId } = require('mongodb')
const serverError = require('../utils/error.js')
const optimizeThumbnail = require('../utils/optimizeImg.js');
const updateLocation = require('../utils/location.js')
let connectDB = require('../utils/database.js')
const verify = require('../utils/verify.js')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

// 게시글 검색
router.get('/search', async (req, res) => {
    try {
        const searchCriteria = [
            {
                $search: {
                    index: 'titleSearch',
                    text: {
                        query: req.query.value,
                        path:'title'
                    }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 10 }, 
        ]
        const result = await db.collection('post').aggregate(searchCriteria).toArray();
        if (result.length > 0){
            const isRead = await updateLocation(req, 'list');
            const resizeImg = await optimizeThumbnail(result);
            return res.render('search.ejs', { 글목록: result, resizeImg, isRead })
        }
        return res.status(404).send("<script>alert('존재하지 않는 글 입니다.');window.location.replace(`/list/1`)</script>");
    } catch (err) {
        serverError(err, res)
    }
})

router.get('', async (req, res) => {
    res.redirect('/list/1') 
})

// 게시글 삭제
router.delete('', verify, async (req, res) => {
    try {
        const result = await db.collection('post').deleteOne({ 작성자: req.user.username, _id: new ObjectId(req.query.docid) })
        if (result.deletedCount > 0) {
            return res.status(200).send('삭제 완료'); // ajax 요청 뒤에 redirect render 사용 x 
        }
        else {
            return res.status(403).send('본인이 작성한 글이 아님'); 
        }
    } catch (err) {
        serverError(err, res)
    }
})

// 게시글 페이지 변경
router.get('/:num', async (req, res) => {
    try {
        const result = await db.collection('post').find().sort({ _id: -1 }).skip((req.params.num - 1) * 5).limit(5).toArray()
        if (!result || result.length === 0) {
            return res.status(404).send("<script>alert('게시글이 존재하지 않습니다.');window.location.replace(`/list/1`)</script>");
        }
        const cnt = await db.collection('post').count();
        const resizeImg = await optimizeThumbnail(result);
        const isRead = await updateLocation(req, 'list');
        return res.render('list.ejs', { 글목록: result, 글수: cnt, 페이지넘버: req.params.num, resizeImg, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

// 게시글 페이지 +1
router.get('/next/:num', async (req, res) => {
    try {
        const result = await db.collection('post')
            .find({ _id: { $lt: new ObjectId(req.params.num) } }).sort({ _id: -1 }).limit(5).toArray()
        const cnt = await db.collection('post').count();
        if (result.length === 0) {
            return res.status(404).send("<script>alert('다음페이지가 존재하지 않습니다.');history.go(-1);</script>");
        }
        const pageNumber = req.query.pageNum;
        const resizeImg = await optimizeThumbnail(result);
        const isRead = await updateLocation(req, 'list');
        return res.render('list.ejs', { 글목록: result, 글수: cnt, 페이지넘버: pageNumber, resizeImg, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

// 게시글 페이지 -1
router.get('/prev/:num', async (req, res) => {
    try {
        const result = await db.collection('post')
            .find({ _id: { $gt: new ObjectId(req.params.num) } }).sort({}).limit(5).toArray()
        result.reverse(); // 몽고디비 sort가 잘 적용되지 않아서 reverse함수로 대체함
        const cnt = await db.collection('post').count();
        if (result.length === 0) {
            return res.status(404).send("<script>alert('이전페이지가 존재하지 않습니다.');history.go(-1);</script>");
        }
        const pageNumber = req.query.pageNum;
        const resizeImg = await optimizeThumbnail(result);
        const isRead = await updateLocation(req, 'list');
        return res.render('list.ejs', { 글목록: result, 글수: cnt, 페이지넘버: pageNumber, resizeImg, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

module.exports = router