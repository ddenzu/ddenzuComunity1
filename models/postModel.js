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
exports.findPostsByPage = async (page) => {
    return db.collection('post')
    .find()
    .sort({ _id: -1 })
    .skip((page - 1) * 5)
    .limit(5)
    .toArray();
};

// 다음 페이지 게시물 찾기
exports.findNextPagePostsById = async (postId) => {
    return db.collection('post')
    .find({ _id: { $lt: new ObjectId(postId) } })
    .sort({ _id: -1 })
    .limit(5)
    .toArray();
};

// 이전 페이지 게시물 찾기
exports.findPrevPagePostsById = async (postId) => {
    return db.collection('post')
    .find({ _id: { $gt: new ObjectId(postId) } })
    .sort({ _id: 1 }) 
    .limit(5)
    .toArray();
};

// 게시물 찾기
exports.findPostByPostId = async (postId) => {
    return db.collection('post')
    .findOne({ _id: new ObjectId(postId) });
};

// 게시물 삭제
exports.deletePostByUsername = async (username, postId) => {
    return db.collection('post')
    .deleteOne({
        작성자: username,
        _id: new ObjectId(postId)
    });
};

// 게시물 작성
exports.insertPost = async (postDetails) => {
    return db.collection('post').insertOne(postDetails);
};

// 게시물 수정
exports.updatePostByPostId = async (postId, updatedPost) => { 
    return db.collection('post')
    .updateOne(
        { _id: new ObjectId(postId) }, // 필터 조건
        { $set: updatedPost }          // 업데이트할 내용
    );
};

// 게시물 카운트
exports.countPosts = async () => {
    return db.collection('post').countDocuments();
};

// 게시물 좋아요 + 1
exports.incrementLike = async (postId) => {
    return db.collection('post').updateOne(
        { _id: new ObjectId(postId) }, // 필터 조건: 게시물 ID
        { $inc: { like: 1 } }          // 업데이트 연산: 좋아요 수 증가
    );
};

// 해당 게시물의 댓글 찾기
exports.findCommentsByPostId = async (postId) => {
    return db.collection('comment').find(
        { 
            postId: new ObjectId(postId), 
            parentId: null 
        }
    ).toArray();
};

// 해당 게시물의 대댓글 찾기
exports.findReCommentsByPostId = async (postId) => {
    return db.collection('comment').find(
        { 
            postId: new ObjectId(postId), 
            parentId: { $exists: true } 
        }
    ).toArray();
};

// 댓글 작성
exports.insertComment = async (comment) => {
    return db.collection('comment').insertOne(comment);
};

// 대댓글 작성
exports.insertReComment = async (recomment) => {
    return db.collection('comment').insertOne(recomment);
};

// 댓글,대댓글 삭제
exports.deleteCommentByCommentId = async (commentId) => {
    return db.collection('comment').deleteOne(
        { _id: new ObjectId(commentId) }
    );
};