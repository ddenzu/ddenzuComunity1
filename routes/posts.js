const router = require('express').Router()
const verify = require('../middlewares/verify.js')
const upload = require('../utils/upload.js')
const postController = require('../controllers/postController');

//posts api
router.get('', postController.redirectFirstPage); // 첫 페이지 조회
router.post('', verify, upload.array('img1'), postController.createPost); // 게시물 작성
router.get('/write', verify, postController.getWritePage); // 게시물 작성 페이지 조회
router.get('/search', postController.searchPosts); // 게시물 검색
router.get('/page/:page', postController.getPostsPage); // 게시물 리스트 페이지 조회
router.get('/page/next/:postId', postController.getNextPagePosts); // 게시물 리스트 페이지 + 1
router.get('/page/prev/:postId', postController.getPrevPagePosts); // 게시물 리스트 페이지 - 1
router.post('/optimize-thumbnails', postController.optimizeThumbnails); // 썸네일 최적화 요청
router.get('/:postId/edit', verify, postController.getEditPage); // 게시물 업데이트 페이지 조회
router.get('/:postId', postController.getPostDetail); // 게시물 조회
router.delete('/:postId', verify, postController.deletePost); // 게시물 삭제
router.put('/:postId', postController.updatePost); // 게시물 업데이트
router.put('/:postId/like', postController.updateLike); // 게시물의 좋아요 + 1
router.post('/:postId/comments', verify, postController.postComment); // 게시물에 댓글 작성
router.post('/:postId/recomments', verify, postController.postReComment); // 댓글에 대댓글 작성
router.delete('/:postId/comments', verify, postController.deleteComment); // 댓글 삭제

module.exports = router