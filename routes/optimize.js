const router = require('express').Router()
let connectDB = require('../utils/database.js')
const serverError = require('../utils/error.js')
const {optimizeThumbnail} = require('../utils/optimizeImg.js');

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

// 썸네일 최적화 api
router.post('/thumbnails', async (req, res) => {
    try{
        const result = await optimizeThumbnail(req.body)
        if(result === 0){
            return res.status(404).send('썸네일 최적화 실패')
        }
        return res.status(200).json(result)
    } catch(err) {
        serverError(err, res)
    }
});

module.exports = router