const passport = require('passport')
const LocalStrategy = require('passport-local')
let connectDB = require('../utils/database.js')
const { ObjectId } = require('mongodb')
const userModel = require('../models/userModel');

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

passport.use(new LocalStrategy(async (username, password, cb) => { 
    const user = await db.collection('user').findOne({ username })
    if (!user) {
        return cb(null, false, { message: '존재하지 않는 아이디 입니다.' })
    }
    if (await userModel.comparePassword(password, user.password)) { 
        return cb(null, user) // user 가 serializeUser (user) 로 들어감
    } else {
        return cb(null, false, { message: '비밀번호가 일치하지 않습니다.' });
    }
})) 

passport.serializeUser((user, done) => {
    process.nextTick(() => { // 비동기적으로 실행
        done(null, { id: user._id, username: user.username })
    })
}) // 로그인할 때 세션만들고 쿠키주기

passport.deserializeUser(async (user, done) => {
    const result = await db.collection('user').findOne({ _id: new ObjectId(user.id) })
    delete result.password
    process.nextTick(() => {
        return done(null, result)
    })
}) // 유저가 보낸 쿠키를 분석(세션데이터랑 비교)하는 함수 , 이제 api 에서 (요청.user) 사용가능

module.exports = passport;