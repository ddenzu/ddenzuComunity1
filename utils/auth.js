const bcrypt = require('bcrypt')
const passport = require('passport')
const LocalStrategy = require('passport-local')
let connectDB = require('./database.js')
const { ObjectId } = require('mongodb')

let db
connectDB.then((client) => {
    db = client.db('forum')
}).catch((err) => {
    console.log(err)
})

passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => { // 로그인 검사 로직
    let result = await db.collection('user').findOne({ username: 입력한아이디 })
    if (!result) {
        return cb(null, false, { message: '존재하지 않는 아이디 입니다.' })
    }
    if (await bcrypt.compare(입력한비번, result.password)) { // 해싱한 비번 확인
        return cb(null, result) // 여기 result 가 serializeUser (user) 로 들어감
    } else {
        return cb(null, false, { message: '비밀번호가 일치하지 않습니다.' });
    }
})) // 유저가 제출한 id,password가 db랑 일치하는지 확인하는 로직

passport.serializeUser((user, done) => {
    console.log(user)
    process.nextTick(() => { // 비동기적으로 실행 (처리보류)
        done(null, { id: user._id, username: user.username })
    })
}) // 로그인할때 세션만들고 쿠키주기

passport.deserializeUser(async (user, done) => {
    let result = await db.collection('user').findOne({ _id: new ObjectId(user.id) })
    delete result.password
    process.nextTick(() => {
        return done(null, result)
    })
}) // 유저가 보낸 쿠키를 분석(세션데이터랑 비교)하는 로직 , 이제 api 에서 (요청.user) 사용가능

module.exports = passport;