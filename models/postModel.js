const { ObjectId } = require('mongodb');
let connectDB = require('../utils/database.js')
let db;

connectDB.then((client) => {
    db = client.db('forum');
}).catch((err) => {
    console.log(err);
});

// 게시물 검색
exports.findPostsBySearch = async (value) => {
    const searchCriteria = [
        { $search: { index: 'titleSearch', text: { query: value, path: 'title' } } },
        { $sort: { _id: -1 } },
        { $limit: 10 },
    ];
    return db.collection('post').aggregate(searchCriteria).toArray();
};

// 특정 페이지의 게시물 찾기
exports.findPostsByPage = async (pageNum) => {
    return db.collection('post').find().sort({ _id: -1 }).skip((pageNum - 1) * 5).limit(5).toArray();
};

// 다음 페이지 게시물 찾기
exports.findNextPagePostsById = async (postId) => {
    return db.collection('post').find({ _id: { $lt: new ObjectId(postId) } }).sort({ _id: -1 }).limit(5).toArray();
};

// 이전 페이지 게시물 찾기
exports.findPrevPagePostsById = async (postId) => {
    return db.collection('post').find({ _id: { $gt: new ObjectId(postId) } }).limit(5).toArray();
};

// 게시물 찾기
exports.findPostByPostId = async (postId) => {
    return db.collection('post').findOne({ _id: new ObjectId(postId) });
};

// 게시물 삭제
exports.deletePostByUsername = async (username, postId) => {
    return db.collection('post').deleteOne({ 작성자: username, _id: new ObjectId(postId) });
};

// 게시물 작성
exports.insertPost = async (postDetails) => {
    return db.collection('post').insertOne(postDetails);
};

// 게시물 수정
exports.updatePostByPostId = async (postId, updatedPost) => { // 게시물 id
    return db.collection('post').updateOne({ _id: new ObjectId(postId) }, { $set: updatedPost });
};

// 게시물 카운트
exports.countPosts = async () => {
    return db.collection('post').countDocuments();
};

// 게시물 좋아요 + 1
exports.incrementLike = async (postId) => {
    return db.collection('post').updateOne({ _id: new ObjectId(postId) }, { $inc: { like: 1 } });
};

// 해당 게시물의 댓글 찾기
exports.findCommentsByPostId = async (postId) => {
    return db.collection('comment').find({ postId: new ObjectId(postId), parentId: null }).toArray();
};

// 해당 게시물의 대댓글 찾기
exports.findReCommentsByPostId = async (postId) => {
    return db.collection('comment').find({ postId: new ObjectId(postId), parentId: { $exists: true } }).toArray();
};

// 댓글 작성
exports.insertComment = async (commentData) => {
    return db.collection('comment').insertOne(commentData);
};

// 대댓글 작성
exports.insertReComment = async (recommentData) => {
    return db.collection('comment').insertOne(recommentData);
};

// 댓글,대댓글 삭제
exports.deleteCommentByCommentId = async (commentId) => {
    return db.collection('comment').deleteOne({ _id: new ObjectId(commentId) });
};