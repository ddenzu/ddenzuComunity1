const router = require('express').Router()
let connectDB = require('../utils/database.js')
const verify = require('../utils/verify.js')
const upload = require('../utils/upload.js')
const postController = require('../controllers/postController');

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

router.get('', postController.redirectFirstPage);
router.get('/search', postController.searchPosts);
router.post('/optimize-thumbnails', postController.optimizeThumbnails);
router.delete('', verify, postController.deletePost);
router.get('/page/:num', postController.getPostsPage);
router.get('/page/next/:num', postController.getNextPagePosts);
router.get('/page/prev/:num', postController.getPrevPagePosts);
router.get('/write', verify, postController.getWritePage);
router.post('', verify, upload.array('img1'), postController.createPost);
router.get('/edit/:id', verify, postController.getEditPage);
router.put('/edit', postController.updatePost);
router.get('/:id', postController.getPostDetail);
router.post('/comments', verify, postController.postComment);
router.delete('/comments', verify, postController.deleteComment);
router.post('/recomments', verify, postController.postReComment);
router.put('/like', postController.updateLike);

module.exports = router