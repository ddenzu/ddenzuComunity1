const express = require('express')
const app = express()
const methodOverride = require('method-override') // form 태그에서 put, delete 요청 가능
const http = require('http').createServer(app);
const useWebSocket = require('./utils/websocket.js');
const io = useWebSocket(http);
require('dotenv').config()
const cors = require('cors');

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public')) 
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors());

// Middlewares, utils
const passport = require('./middlewares/passport');
const sessionMiddleware = require('./middlewares/session.js');
const connectDB = require('./utils/database.js');
app.use(passport.initialize())
app.use(sessionMiddleware)
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