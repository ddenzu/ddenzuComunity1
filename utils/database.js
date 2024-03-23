// 라우터와 서버가 상호참조하지 않기 위해 생성
const { MongoClient } = require('mongodb')

const url = process.env.DB_URL
let connectDB = new MongoClient(url).connect()
console.log('DB연결성공')

module.exports = connectDB