const { ObjectId } = require('mongodb')
const serverError = require('../utils/error.js')
const {getThumbnail} = require('../utils/optimizeImg.js');
const dateFormat1 = require("./../public/time.js");
const postModel = require('../models/postModel');
const userModel = require('../models/userModel');
const {optimizeThumbnail} = require('../utils/optimizeImg.js');

// 첫 페이지 조회
exports.redirectFirstPage = (req, res) => {
    res.redirect('/posts/page/1');
};

// 게시물 작성
exports.createPost = async (req, res) => {
    try {
        if (!req.body.title || !req.body.content) {
            return res.status(400).send('내용이 존재하지 않습니다');
        }
        if (req.body.title.length > 20) {
            return res.status(400).send("글의 제목이 20글자를 초과함");
        }
        const postDetails = {
            title: req.body.title,
            content: req.body.content,
            작성자_id: req.user._id,
            작성자: req.user.username,
            like: 0,
            date: dateFormat1.dateFormat(new Date())
        };
        if (req.files.length === 0) {
            await postModel.insertPost(postDetails);
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
            await postModel.insertPost(postDetails);
        }
        return res.status(200).send('글작성 성공');
    } catch (err) {
        serverError(err, res);
    }
};

// 게시물 작성 페이지 조회
exports.getWritePage = async (req, res) => {
    try {
        const isRead = req.user ? req.user.isRead : true;
        return res.render('posts/write.ejs', { isRead });
    } catch (err) {
        serverError(err, res);
    }
};

// 게시물 검색
exports.searchPosts = async (req, res) => {
    try {
        const postList = await postModel.findPostsBySearch(req.query.value);
        if (postList.length > 0) {
            const [isRead, thumbailUrls] = await Promise.all([
                userModel.updateLocation(req, 'list'),
                getThumbnail(postList),
            ]);
            return res.render('posts/search.ejs', { 글목록: postList, thumbailUrls, isRead });
        }
        return res.status(404).send("<script>alert('존재하지 않는 글 입니다.');window.location.replace(`/posts/page/1`)</script>");
    } catch (err) {
        serverError(err, res);
    }
};

// 게시물 리스트 페이지 조회
exports.getPostsPage = async (req, res) => {
    try {
        const postList = await postModel.findPostsByPage(req.params.page);
        if (!postList || postList.length === 0) {
            return res.status(404).send("<script>alert('게시글이 존재하지 않습니다.');window.location.replace(`/posts/page/1`)</script>");
        }
        const [thumbailUrls, cnt, isRead] = await Promise.all([
            getThumbnail(postList),
            postModel.countPosts(),
            userModel.updateLocation(req, 'list'),
        ]);
        return res.render('posts/list.ejs', { 글목록: postList, 글수: cnt, 페이지넘버: req.params.page, thumbailUrls, isRead });
    } catch (err) {
        serverError(err, res);
    }
};

// 게시물 리스트 페이지 + 1
exports.getNextPagePosts = async (req, res) => {
    try {
        const postList = await postModel.findNextPagePostsById(req.params.postId);
        if (postList.length === 0) {
            return res.status(404).send("<script>alert('다음페이지가 존재하지 않습니다.');history.go(-1);</script>");
        }
        const pageNumber = req.query.page;
        const [thumbailUrls, cnt, isRead] = await Promise.all([
            getThumbnail(postList),
            postModel.countPosts(),
            userModel.updateLocation(req, 'list'),
        ]);
        return res.render('posts/list.ejs', { 글목록: postList, 글수: cnt, 페이지넘버: pageNumber, thumbailUrls, isRead });
    } catch (err) {
        serverError(err, res);
    }
};

// 게시물 리스트 페이지 - 1
exports.getPrevPagePosts = async (req, res) => {
    try {
        const postList = await postModel.findPrevPagePostsById(req.params.postId);
        if (postList.length === 0) {
            return res.status(404).send("<script>alert('이전페이지가 존재하지 않습니다.');history.go(-1);</script>");
        }
        postList.reverse();
        const pageNumber = req.query.page;
        const [thumbailUrls, cnt, isRead] = await Promise.all([
            getThumbnail(postList),
            postModel.countPosts(),
            userModel.updateLocation(req, 'list'),
        ]);
        return res.render('posts/list.ejs', { 글목록: postList, 글수: cnt, 페이지넘버: pageNumber, thumbailUrls, isRead });
    } catch (err) {
        serverError(err, res);
    }
};

// 썸네일 최적화 요청
exports.optimizeThumbnails = async (req, res) => {
    try{
        const result = await optimizeThumbnail(req.body)
        if(result === 0){
            return res.status(404).send('썸네일 최적화 실패')
        }
        return res.status(200).json(result)
    } catch(err) {
        serverError(err, res)
    }
};

// 게시물 업데이트 페이지 조회
exports.getEditPage = async (req, res) => {
    try {
        const isRead = req.user ? req.user.isRead : true;
        const editPost = await postModel.findPostByPostId(req.params.postId);
        if (!editPost) {
            return res.status(404).send('게시글이 db에 존재하지 않음');
        }
        return res.render('posts/edit.ejs', { result: editPost, isRead });
    } catch (err) {
        serverError(err, res);
    }
};

// 게시물 조회
exports.getPostDetail = async (req, res) => {
    try {
        const result = await postModel.findPostByPostId(req.params.postId);
        if (!result) {
            return res.status(404).send("<script>alert('게시글이 존재하지 않습니다.');window.location.replace(`/list/1`)</script>");
        }
        const [comments, result2, reComments, isRead] = await Promise.all([
            postModel.findCommentsByPostId(req.params.postId),
            userModel.findUserByUserId(result.작성자_id),
            postModel.findReCommentsByPostId(req.params.postId),
            userModel.updateLocation(req, 'detail')
        ]);
        const imageUrl = Array.isArray(result.imgName) ? result.imgName : (result.imgName ? [result.imgName] : []);
        const vidUrl = Array.isArray(result.vidName) ? result.vidName : (result.vidName ? [result.vidName] : []);
        const profile = result2.imgName ? result2.imgName : '';
        return res.render('posts/detail.ejs', {
            글목록: result,
            댓글목록: comments,
            이미지주소: imageUrl,
            프로필: profile,
            동영상주소: vidUrl,
            dateFormat1,
            대댓글: reComments,
            isRead
        });
    } catch (err) {
        serverError(err, res);
    }
};

// 게시물 삭제
exports.deletePost = async (req, res) => {
    try {
        const deletePost = await postModel.deletePostByUsername(req.user.username, req.params.postId);
        if (deletePost.deletedCount > 0) {
            return res.status(200).send('삭제 완료');
        } else {
            return res.status(403).send('본인이 작성한 글이 아님');
        }
    } catch (err) {
        serverError(err, res);
    }
};

// 게시물 업데이트
exports.updatePost = async (req, res) => {
    try {
        if (req.body.title.length > 20) {
            return res.status(400).send('제목이 20자 초과임');
        }
        const originalWriter = JSON.stringify(req.body.userId);
        if (originalWriter === JSON.stringify(req.user._id)) {
            const updatedPost = {
                title: req.body.title,
                content: req.body.content
            };
            await postModel.updatePostByPostId(req.params.postId, updatedPost);
            return res.status(200).send('게시물 수정 성공');
        } else {
            return res.status(403).send("본인이 작성한 글이 아님");
        }
    } catch (err) {
        serverError(err, res);
    }
};

// 게시물의 좋아요 + 1
exports.updateLike = async (req, res) => {
    try {
        await postModel.incrementLike(req.params.postId);
        return res.status(200).send('좋아요 + 1 성공');
    } catch (err) {
        serverError(err, res);
    }
};

// 게시물에 댓글 작성
exports.postComment = async (req, res) => {
    try {
        if (!req.body.content) {
            return res.status(400).send("댓글내용이 존재하지 않음");
        }
        const commentData = {
            postId: new ObjectId(req.params.postId),
            content: req.body.content,
            username: req.user.username,
            userId: req.user._id,
            userprofile: req.user.imgName,
            date: new Date(),
        };
        await postModel.insertComment(commentData);
        return res.status(200).send("댓글 저장 성공");
    } catch (err) {
        serverError(err, res);
    }
};

// 댓글에 대댓글 작성
exports.postReComment = async (req, res) => {
    try {
        if (!req.body.content) {
            return res.status(400).send("대댓글내용이 존재하지 않음");
        }
        const recommentData = {
            postId: new ObjectId(req.params.postId),
            parentId: new ObjectId(req.body.parentCommentId),
            content: req.body.content,
            username: req.user.username,
            userId: req.user._id,
            userprofile: req.user.imgName,
            date: new Date(),
        };
        await postModel.insertReComment(recommentData);
        return res.status(200).send('대댓글 저장 성공');
    } catch (err) {
        serverError(err, res);
    }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
    try {
        if (req.user._id.equals(req.body.userId)) {
            const deletedComment = await postModel.deleteCommentByCommentId(req.body.commentId);
            if (deletedComment) {
                return res.status(200).send('댓글 삭제 성공');
            } else {
                return res.status(404).send("db에 삭제할 댓글이 존재하지 않음");
            }
        } else {
            return res.status(403).send("본인이 작성한 댓글이 아님");
        }
    } catch (err) {
        serverError(err, res);
    }
};