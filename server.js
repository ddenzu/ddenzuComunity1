const express = require('express')
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
app.use(express.static(__dirname + '/public')) 
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors());

// utils
const passport = require('./utils/auth.js');
const connectDB = require('./utils/database.js')

app.use(passport.initialize())
app.use(session({
    secret: '비밀번호',
    resave: false, 
    saveUninitialized: false, 
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
app.use('/users', require('./routes/users.js'))
app.use('/posts', require('./routes/posts.js'))
app.use('/chat', require('./routes/chat.js'))

app.get('/', (req, res) => {
    res.redirect('/posts/page/1')
})