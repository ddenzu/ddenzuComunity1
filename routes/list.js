const router = require('express').Router()
const { ObjectId } = require('mongodb')
const requestIp = require('request-ip')
const serverError = require('../utils/error.js')
const optimizeImage = require('../utils/optimizeImg.js');
const updateLocation = require('../utils/location.js')
let connectDB = require('../utils/database.js')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

router.get('/search', async (req, res) => {
    if (!req.query.value) {
        return res.status(400).send("<script>alert('검색어를 입력해주세요.');;window.location.replace(`/list/1`)</script>");
    }
    try {
        const searchCriteria = [
            {
                $search: {
                    index: 'titleSearch',
                    text: {
                        query: req.query.value,
                        path:'title'  // a,b 둘다 찾고 싶으면 [a, b]
                    }
                }
            },
            { $sort: { _id: 1 } }, // id 순으로 
            { $limit: 10 }, // 10개만
        ]
        const result = await db.collection('post').aggregate(searchCriteria).toArray();
        if (result.length != 0) {
            const isRead = await updateLocation(req, 'list');
            const resizeImgPromises = result.map(async (item) => {
                if (item.imgName) {
                    return await optimizeImage(Array.isArray(item.imgName) ? item.imgName[0] : item.imgName, 75, 80);
                } else {
                    return ''; // 빈 문자열 추가
                }
            });
            const resizeImg = await Promise.all(resizeImgPromises);
            return res.render('search.ejs', { 글목록: result, resizeImg, isRead })
        }
        res.status(404).send("<script>alert('존재하지 않는 글');window.location.replace(`/list/1`)</script>");
    } catch (err) {
        serverError(err, res)
    }
})

router.get('', async (req, res) => {
    await db.collection('post').find().toArray() // await = blocking
    // ejs 파일은 sendFile 아니라 render 사용
    res.redirect('/list/1')
})

router.delete('', async (req, res) => {
    if (!req.user) {
        return res.status(401).send('notLogin'); // 401 엑세스 권한 x
    }
    try {
        const result = await db.collection('post').deleteOne({ 작성자: req.user.username, _id: new ObjectId(req.query.docid) })
        if (result.deletedCount != 0) {
            res.send('삭제완료'); // ajax 요청 뒤에 redirect render 사용 x (장점사라짐) 
        }
        else {
            res.status(403).send('cant'); // 403 엑세스 금지됨
        }
    } catch (err) {
        serverError(err, res)
    }
})

router.get('/:num', async (req, res) => {
    console.log("client IP: " + requestIp.getClientIp(req));
    try {
        const result = await db.collection('post').find().sort({ _id: -1 }).skip((req.params.num - 1) * 5).limit(5).toArray()
        if (!result || result.length === 0) {
            return res.status(404).send("<script>alert('게시글이 존재하지 않습니다.');window.location.replace(`/list/1`)</script>");
        }
        const cnt = await db.collection('post').count();
        const resizeImgPromises = result.map(async (item) => {
            if (item.imgName) {
                return await optimizeImage(Array.isArray(item.imgName) ? item.imgName[0] : item.imgName, 75, 80);
            } else {
                return ''; // 빈 문자열 추가
            }
        });
        const resizeImg = await Promise.all(resizeImgPromises);
        const isRead = await updateLocation(req, 'list');
        res.render('list.ejs', { 글목록: result, 글수: cnt, 페이지넘버: req.params.num, resizeImg, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

router.get('/next/:num', async (req, res) => {
    console.log("client IP: " + requestIp.getClientIp(req));
    try {
        const result = await db.collection('post')
            .find({ _id: { $lt: new ObjectId(req.params.num) } }).sort({ _id: -1 }).limit(5).toArray()
        const cnt = await db.collection('post').count();
        if (result.length < 1) {
            return res.status(404).send("<script>alert('다음페이지가 존재하지 않습니다.');history.go(-1);</script>");
        }
        const pageNumber = req.query.pageNum;
        const resizeImgPromises = result.map(async (item) => {
            if (item.imgName) {
                return await optimizeImage(Array.isArray(item.imgName) ? item.imgName[0] : item.imgName, 75, 80);
            } else {
                return ''; // 빈 문자열 추가
            }
        });
        const resizeImg = await Promise.all(resizeImgPromises);
        const isRead = await updateLocation(req, 'list');
        res.render('list.ejs', { 글목록: result, 글수: cnt, 페이지넘버: pageNumber, resizeImg, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

router.get('/prev/:num', async (req, res) => {
    console.log("client IP: " + requestIp.getClientIp(req));
    try {
        const result = await db.collection('post')
            .find({ _id: { $gt: new ObjectId(req.params.num) } }).sort({}).limit(5).toArray()
        result.reverse(); // 몽고디비 sort가 잘 적용되지 않아서 reverse함수로 대체함
        const cnt = await db.collection('post').count();
        if (result.length < 1) {
            return res.status(404).send("<script>alert('이전페이지가 존재하지 않습니다.');history.go(-1);</script>");
        }
        const pageNumber = req.query.pageNum;
        const resizeImgPromises = result.map(async (item) => {
            if (item.imgName) {
                return await optimizeImage(Array.isArray(item.imgName) ? item.imgName[0] : item.imgName, 75, 80);
            } else {
                return ''; // 빈 문자열 추가
            }
        });
        const resizeImg = await Promise.all(resizeImgPromises);
        const isRead = await updateLocation(req, 'list');
        res.render('list.ejs', { 글목록: result, 글수: cnt, 페이지넘버: pageNumber, resizeImg, isRead });
    } catch (err) {
        serverError(err, res)
    }
})

module.exports = router