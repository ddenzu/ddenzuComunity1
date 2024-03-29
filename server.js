const express = require('express')
const requestIp = require('request-ip')
const app = express()
const methodOverride = require('method-override') // form 태그에서 put, delete 요청 가능
const MongoStore = require('connect-mongo')
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);
require('dotenv').config()
const session = require('express-session')

const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger-output.json')

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public')) //(css.js,jpg...= static파일)은 public 폴더 사용
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const verify = require('./utils/verify.js')
const passport = require('./utils/auth.js');
const connectDB = require('./utils/database.js')

app.use(passport.initialize())
app.use(session({
    secret: '비번',
    resave: false, // 보통 false
    saveUninitialized: false, // 보통 false
    cookie: { maxAge: 60 * 60 * 1000 }, // 로그인 시간 유지
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
app.use('/login', require('./routes/login.js'))
app.use('/register', require('./routes/register.js'))
app.use('/chat', require('./routes/chat.js'))

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile))

app.get('/', (req, res) => {
    console.log("client IP: " + requestIp.getClientIp(req));
    console.log("time : " + new Date())
    res.redirect('/list/1')
})

app.get('/logout', function (req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('서버 에러');
        }
        res.redirect('/list/1');
    });
});

app.put('/locations',verify, async (req, res) => { // 사용자 위치정보 업데이트
    try {
        if (!req.body) {
            return res.status(400).send("위치정보 없음");
        }
        await db.collection('user').updateOne(
            { _id: req.user._id },
            { $set: { location: req.body.content } }
        );
        res.send('위치 업데이트');
    } catch (e) {
        console.log(e);
        res.status(500).send('서버에러')
    }
})

io.on('connection', function (socket) {
    socket.on('user-send', function (data) {
        console.log(data);
        io.emit('broadcast', data);
    });
})
