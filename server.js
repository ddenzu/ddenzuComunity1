const express = require('express')
const requestIp = require('request-ip')
const app = express()
const methodOverride = require('method-override') // form 태그에서 put, delete 요청 가능
const MongoStore = require('connect-mongo')
const http = require('http').createServer(app);
const useWebSocket = require('./utils/websocket.js')
const io = useWebSocket(http)
require('dotenv').config()
const session = require('express-session')
const cors = require('cors');

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public')) //(css.js,jpg...= static파일)은 public 폴더 사용
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors());

// utils
const verify = require('./utils/verify.js')
const passport = require('./utils/auth.js');
const connectDB = require('./utils/database.js')
const serverError = require('./utils/error.js');

app.use(passport.initialize())
app.use(session({
    secret: '비번',
    resave: false, // 보통 false
    saveUninitialized: false, // 보통 false
    cookie: { maxAge: 60 * 60 * 1000 }, 
    store: MongoStore.create({
        mongoUrl: process.env.DB_URL,
        dbName: 'forum',
    })
}))
app.use(passport.session())

let db
connectDB.then((client) => {
    db = client.db('forum')
    http.listen(process.env.PORT, '0.0.0.0', () => {
        console.log("http://localhost:" + process.env.PORT + " 에서 서버 실행중")
    })
}).catch((err) => {
    console.log(err)
})

// Routes
app.use('/list', require('./routes/list.js'))
app.use('/detail', require('./routes/detail.js'))
app.use('/write', require('./routes/write.js'))
app.use('/mypage', require('./routes/mypage.js'))
app.use('/edit', require('./routes/edit.js'))
app.use('/log', require('./routes/log.js'))
app.use('/register', require('./routes/register.js'))
app.use('/chat', require('./routes/chat.js'))

app.get('/', (req, res) => {
    console.log("client IP: " + requestIp.getClientIp(req));
    console.log("time : " + new Date())
    res.redirect('/list/1')
})