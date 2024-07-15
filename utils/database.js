// 라우터와 서버가 상호참조하지 않기 위해 생성
const { MongoClient } = require('mongodb')
// connect 함수가 늦게 처리 될 경우 db 연결에 문제생길 수 있기 때문에
// connectDB.then 은 라우터에서 처리
const url = process.env.DB_URL
let connectDB = new MongoClient(url).connect()
console.log('DB연결성공')

module.exports = connectDB