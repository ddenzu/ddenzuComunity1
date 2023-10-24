const express = require('express')
const requestIp = require('request-ip')
const app = express()
const { MongoClient, ObjectId } = require('mongodb')
const methodOverride = require('method-override') // form 태그에서 put, delete 요청 가능
const bcrypt = require('bcrypt')
const MongoStore = require('connect-mongo')
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);
require('dotenv').config()

app.use(methodOverride('_method')) 
app.use(express.static(__dirname + '/public')) //(css.js,jpg...= static파일)은 public 폴더 사용
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')

app.use(passport.initialize())
app.use(session({
  secret: '암호화에 쓸 비번',
  resave : false, // 보통 false
  saveUninitialized : false, // 보통 false
  cookie : { maxAge : 100 * 60 * 1000  }, // 로그인 시간 유지
  store: MongoStore.create({
    mongoUrl : process.env.DB_URL,
    dbName: 'forum',
  })
}))
app.use(passport.session()) 

// const { S3Client } = require('@aws-sdk/client-s3')
// const multer = require('multer')
// const multerS3 = require('multer-s3')
// const s3 = new S3Client({
//   region : 'ap-northeast-2',
//   credentials : {
//       accessKeyId : process.env.S3_KEY,
//       secretAccessKey : process.env.S3_SECRET,
//   }
// })

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: 'ddenzubucket',
//     key: function (요청, file, cb) {
//       cb(null, Date.now().toString()) //업로드시 파일명 변경가능 겹치면안됨
//     }
//   })
// })

let db
const url = process.env.DB_URL
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
  http.listen(process.env.PORT,'0.0.0.0', () => {
    console.log("http://localhost:"+process.env.PORT+"에서 서버 실행중")
})
}).catch((err)=>{
  console.log(err)
})

// ---------------------------------------------------------------------
// url을 통해 드러나지 않았으면 하는 데이터를 전달할땐 post 방식 , 유저가 서버한테 데이터줄때
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    let result = await db.collection('user').findOne({ username : 입력한아이디})
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음' })
    }
    if (await bcrypt.compare(입력한비번, result.password)) { // 해싱한 비번 확인
      return cb(null, result) // 여기 result 가 serializeUser (user) 로 들어감
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
})) // 유저가 제출한 id,password가 db랑 일치하는지 확인하는 로직

passport.serializeUser((user, done) => {
    console.log(user)
    process.nextTick(() => { // 특정코드를 비동기적으로 실행 (처리보류)
      done(null, { id: user._id, username: user.username })
    })
}) // 로그인할때 세션만들고 쿠키주기

passport.deserializeUser(async(user, done) => {
    let result = await db.collection('user').findOne({_id : new ObjectId(user.id)})
    delete result.password
    process.nextTick(() => {
      return done(null, result)
    })
}) // 유저가 보낸 쿠키를 분석(세션데이터랑 비교)하는 로직 ..... 이제 아무 api 에서 (요청.user) 로 확인가능

// ---------------------------------------------------------------------

app.get('/', (요청, 응답) => {
    console.log("client IP: " +requestIp.getClientIp(요청));
    console.log("time : "+new Date())
    응답.redirect('/list/1')
}) 

app.get('/dbadd', (요청, 응답) => { //get : url을 서버에서 주면서 서버에게 요청,밑에 함수 실행
    // db.collection('post').insertOne({title : '111'})
    응답.send('db넣기 성공')

}) 

app.get('/list', async (요청, 응답) => {
    let result = await db.collection('post').find().toArray() // await = blocking
    // ejs 파일은 sendFile 아니라 render 사용
    응답.render('list.ejs', { 글목록 : result}) // 글목록 이란 이름으로 result 값 보냄
}) 

app.get('/write', (요청, 응답) => {
    응답.render('write.ejs')
})
// multer 라이브러리 세팅
let multer = require('multer');
const sharp = require("sharp");
const fs = require('fs');
const path = require('path');
var storage = multer.diskStorage({
  destination : function(req, file, cb){
    cb(null, './public/image') // 이미지 어디에 저장할건지
  },
  filename : function(req, file, cb){
    cb(null, Date.now()+file.originalname) // 파일명 설정하기
  },
//   filefilter : function(req, file, cb){

//   }
});

var upload = multer({storage : storage}); // 갖다 쓰면됨

function checkLogin(요청, 응답, next) {
    if (요청.user) {
        next()
    }
    else {
        응답.send('로그인 하삼')
    }
}

// sharp('/image/'+요청.file.filename)
//     .resize( {width: 100})
//     .toFile(요청.file.filename)
//     .then(()=> console.log('done'))

app.post('/add', upload.single('img1'), async (요청, 응답) => { // write 페이지에서 post 요청하면 여기로 데이터 날라옴
    console.log(요청.file)
    try {
        if (요청.body.title==""||요청.body.content==""){
            응답.send('잘못된 아이디 or 비번')
        } 
        else {
            try {
                if (요청.file==undefined){
                    await db.collection('post').insertOne({title : 요청.body.title , 
                    content : 요청.body.content , 작성자_id : 요청.user._id, 작성자 : 요청.user.username, like : 0})
                    응답.redirect('/list/1')
                }
                else {
                    if(요청.file.mimetype=='video/mp4' || 요청.file.mimetype=='video/quicktime'){
                        await db.collection('post').insertOne({title : 요청.body.title , 
                        content : 요청.body.content , 작성자_id : 요청.user._id, 작성자 : 요청.user.username, like : 0
                        ,vidName : 요청.file.filename})
                        응답.redirect('/list/1') // redirect 하면 url 로 GET 요청을 자동으로 해줌, 그래서  { 글목록 : result} 이런거 안줘도됨                        
                    }
                    else {
                        sharp(`public/image/${요청.file.filename}`,{ failOn: 'truncated' }) // 리사이징할 파일의 경로
                        .resize({ width: 400 }) // 원본 비율 유지하면서 width 크기만 설정
                        .withMetadata()
                        .toFile(`public/image/resize-${요청.file.filename}`, (err, info) => {
                        if (err) throw err;
                        console.log(`info : ${info}`);
                        fs.unlink(`public/image/${요청.file.filename}`, (err) => {
                            // 원본파일은 삭제해줍니다
                            // 원본파일을 삭제하지 않을거면 생략해줍니다
                            //  if (err) throw err;
                        });
                        });
                        await db.collection('post').insertOne({title : 요청.body.title , 
                        content : 요청.body.content , 작성자_id : 요청.user._id, 작성자 : 요청.user.username, like : 0
                        ,imgName : 'resize-'+요청.file.filename})
                        응답.redirect('/list/1') // redirect 하면 url 로 GET 요청을 자동으로 해줌, 그래서  { 글목록 : result} 이런거 안줘도됨                         
                    }
                }
             } catch (err) {
                console.log(err);
             }
        }
    } catch(e) {
        console.log(e)
        응답.status(500).send('서버에러')
    }
})

app.post('/addprofile', upload.single('img1'), async (req, res, next) => { // write 페이지에서 post 요청하면 여기로 데이터 날라옴
    try {
        sharp(`public/image/${req.file.filename}`,{ failOn: 'truncated' }) // 리사이징할 파일의 경로
           .resize({ width: 25}) // 원본 비율 유지하면서 width 크기만 설정
           .withMetadata()
           .toFile(`public/image/resize-${req.file.filename}`, (err, info) => {
              if (err) throw err;
              console.log(`info : ${info}`);
              fs.unlink(`public/image/${req.file.filename}`, (err) => {
                 // 원본파일은 삭제해줍니다
                 // 원본파일을 삭제하지 않을거면 생략해줍니다
                //  if (err) throw err;
              });
           });
           await db.collection('user').updateOne({ _id : new ObjectId(req.user._id)}, {$set : {imgName : 'resize-'+req.file.filename}})
            res.redirect('/list/1')
     } catch (err) {
        console.log(err);
     }
  });

// app.get('/image/:imageName', function(요청, 응답){
//     console.log(요청.params.imageName)
//     응답.sendFile( __dirname + '/public/image/' + 요청.params.imageName)
// })

app.get('/detail/:id', async (요청, 응답)=>{
    // 요청.params 하면 유저가 url 파라미터에 입력한 데이터 가져옴(:id)
    try {
        let result = await db.collection('post').findOne({ _id : new ObjectId(요청.params.id)})
        let result2 = await db.collection('comment').find({ postId : new ObjectId(요청.params.id)}).toArray()
        let result3 = await db.collection('user').findOne({ _id : result.작성자_id})
        if (result == null) {
            응답.status(400).send('이상한 url')
        } 
        else {
            if(result.imgName==undefined){
                if(result3.imgName==undefined){
                    if(result.vidName==undefined){
                        응답.render('detail.ejs', {글목록 : result, 댓글목록 : result2, 
                        이미지주소 : "", 프로필 : "", 동영상주소 : ""})                        
                    }
                    else{
                        응답.render('detail.ejs', {글목록 : result, 댓글목록 : result2, 
                        이미지주소 : "", 프로필 : "", 동영상주소 : "/image/"+result.vidName})                             
                    } 
                }
                else {
                    if(result.vidName==undefined){
                        응답.render('detail.ejs', {글목록 : result, 댓글목록 : result2, 
                        이미지주소 : "", 프로필 : result3.imgName, 동영상주소 : ""})                        
                    }
                    else {
                        응답.render('detail.ejs', {글목록 : result, 댓글목록 : result2, 
                        이미지주소 : "", 프로필 : result3.imgName, 동영상주소 : "/image/"+result.vidName})                        
                    }
                }
            } 
            else {
                if(result3.imgName==undefined){
                    응답.render('detail.ejs', {글목록 : result, 댓글목록 : result2,
                    이미지주소: "/image/"+result.imgName,  프로필 : "", 동영상주소 : ""})                     
                }
                else {
                    응답.render('detail.ejs', {글목록 : result, 댓글목록 : result2,
                    이미지주소: "/image/"+result.imgName,  프로필 : result3.imgName, 동영상주소 : ""})                     
                }
            }
        }
    }
    catch(e) {
        console.log(e)
        응답.status(400).send('이상한 url') //500 => 서버문제 , 400 => 유저문제(이상한 요청)
    }
})

app.get('/edit/:id',checkLogin, async (요청, 응답)=>{
    let result = await db.collection('post').findOne({ _id : new ObjectId(요청.params.id)})
    응답.render('edit.ejs', {result : result} )         
})

app.put('/edit', async (요청, 응답) => {

    var 아이디비교용 = JSON.stringify(요청.body.userId)
    if(아이디비교용===JSON.stringify(요청.user._id)){
        await db.collection('post').updateOne({ _id : new ObjectId(요청.body.id)}, {$set : {title : 요청.body.title , 
        content : 요청.body.content}})
        응답.redirect('/list/1')
    }
    else {
        응답.send('지우지망')
    }
    // await db.collection('post').updateOne({ _id : 1 }, {$inc : {like : 1}})

})


app.delete('/delete', async (요청, 응답)=>{
    // console.log(요청.query) // 게시물id
    // console.log(요청.user.username) // 유저 id
    if (요청.user){
        await db.collection('post').deleteOne({작성자 : 요청.user.username, _id : new ObjectId(요청.query.docid)})
        응답.send('삭제완료') // ajax 요청 뒤에 redirect render 사용 x (장점사라짐) 
    }
    else {
        응답.send('삭제실패')
    }

})


app.get('/plus', async (요청, 응답) => {
    if (요청.user == undefined){
        응답.send('로그인 하삼')
    }
    else {
        let result = await db.collection('user').findOne({ username : 요청.user.username})
        console.log("client IP: " +requestIp.getClientIp(요청));
        if (요청.user.username==result.username){
            응답.render('write.ejs')
        }
        else {
            응답.send('로그인 하삼')
        }
    }
})

app.get('/list/:num', async (요청, 응답) => {
    console.log("client IP: " +requestIp.getClientIp(요청));
    console.log(요청.params.num)
    let result = await db.collection('post').find().sort({ _id: -1 }).skip((요청.params.num-1)*5).limit(5).toArray()
    let cnt = await db.collection('post').count();
    응답.render('list.ejs', { 글목록 : result , 글수 : cnt})
}) 


app.get('/list/next/:num', async (요청, 응답) => {
    console.log("client IP: " +requestIp.getClientIp(요청));
    let result = await db.collection('post')
    .find({_id : {$lt : new ObjectId(요청.params.num)}}).sort({ _id: -1 }).limit(5).toArray()
    let cnt = await db.collection('post').count();
    if(result.length<1){
        응답.send('글 없샤🤍')
    }
    else{
        
        응답.render('list.ejs', { 글목록 : result, 글수 : cnt})
    }
}) 

// 첫번째 검색기능
app.post('/search', async (요청, 응답) => {
    let result = await db.collection('post').findOne({ title : 요청.body.info})
    응답.render('detail.ejs', { 글목록 : result})
}) 

// 두번째 검색기능
app.get('/ssearch', async (요청, 응답) => {
    var 검색조건 = [
        {
          $search: {
            index: 'titleSearch',
            text: {
              query: 요청.query.value,
              path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
            }
          }
        },
        { $sort : { _id : 1 }}, // id 순으로 정렬
        { $limit : 10 }, // 10개만 보여줘
        // { $project : {title:1, _id:0, score: { $meta : "searchScore"}}}

    ] 
    let result = await db.collection('post').aggregate(검색조건).toArray()
    응답.render('search.ejs', { 글목록 : result})
}) 

app.get('/login', async (요청, 응답) => {
    응답.render('login.ejs')
}) 


app.post('/login', async (요청, 응답, next) => {
    passport.authenticate('local', (error, user, info)=>{
        if (error) return 응답.status(500).json(error) // 에러날때
        if (!user) return 응답.status(401).json(info.message) // db에 없을때
        요청.logIn(user, (err)=>{
            if (err) return next(err)
            응답.redirect('/list/1') // 성공했을때
        })
    })(요청, 응답, next)
}) 

app.get('/mypage', async (요청, 응답)=>{
    if (!요청.user){
        응답.send('로그인 하삼')
    }
    else {
        let result = await db.collection('user').findOne({ username : 요청.user.username})
        응답.render('mypage.ejs', { 아이디 : result })      
    }
})

app.get('/register', async (요청, 응답) => {
    응답.render('register.ejs')
}) 

app.post('/register', async (요청, 응답) => {
    // 회원가입시 아이디 비번 조건 필터링기능 만들기
    let result = await db.collection('user').findOne({ username : 요청.body.username})
    if (result){
        응답.send('이미존재하는 ID')
    }
    else {
        let 해시 = await bcrypt.hash(요청.body.password, 10) // 10 이면 적당히 꼬은거
        await db.collection('user').insertOne({username : 요청.body.username, 
        password : 해시})
        응답.redirect('/list/1')
    }
})

app.get('/logout',function(요청, 응답){
    요청.session.destroy(function(err){
        응답.redirect('/list/1');
    });
});

// app.get('/image/:imageName', function(요청, 응답){
//     응답.sendFile( __dirname + '/public/image' + 요청.params.imageName)
// })
// app.use('/board/sub',require('./routes/board.js'))


app.post('/chatroom', checkLogin, function(요청, 응답){
    var 저장할거 = {
        title : 요청.body.채팅방+"채팅방",
        member : [new ObjectId(요청.body.당한사람id), 요청.user._id],
        date : new Date()
    }
    db.collection('chatroom').insertOne(저장할거).then((결과)=>{
    })
})

app.post('/chat', checkLogin, async function(요청, 응답){
    var result = await db.collection('chatroom').find({ member : 요청.user._id}).toArray()
    응답.render('chat.ejs', { data : result, cur : 요청.user._id})
})

app.get('/chat', checkLogin, async function(요청, 응답){
    var result = await db.collection('chatroom').find({ member : 요청.user._id}).toArray()
    응답.render('chat.ejs', { data : result, cur : 요청.user._id})
})

app.post('/message', checkLogin, function(요청, 응답){
    if (요청.body.content) {
        var 저장할거 = {
            parent : 요청.body.parent, // 채팅방의 id
            content : 요청.body.content, // 채팅내용
            userid : 요청.user._id, // 채팅 건 사람
            date : new Date(),
        }
        db.collection('message').insertOne(저장할거).then(()=>{
    })}
})

app.post('/comment', checkLogin, function(요청, 응답){
    if (요청.body.content) {
        var 저장할거 = {
            postId : new ObjectId(요청.body.parent), // 작성글 id
            content : 요청.body.content, // 채팅내용
            username : 요청.user.username, // 채팅 건 사람
            userId : 요청.user._id,
            userprofile : 요청.user.imgName,
            date : new Date(),
        }
        db.collection('comment').insertOne(저장할거).then(()=>{
    })}
})

app.get('/message/:id', checkLogin, function(요청, 응답){
    응답.writeHead(200, {
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
    db.collection('message').find({parent: 요청.params.id}).toArray().then((결과)=>{
        응답.write('event: test\n');
        응답.write('data: ' + JSON.stringify(결과) +'\n\n');
    })

    const 찾을문서 = [
        { $match: { 'fullDocument.parent': 요청.params.id } }
    ];

    const changeStream = db.collection('message').watch(찾을문서);
    changeStream.on('change', result => {
        var 추가된문서 = [result.fullDocument];
        응답.write('event: test\n');
        응답.write('data: ' + JSON.stringify(추가된문서) +'\n\n');
    });
});

app.post('/deletee', async (요청, 응답)=>{
    await db.collection('chatroom').deleteOne({ _id : new ObjectId(요청.body.삭제id)})
    // 응답.redirect('chat.ejs')
})
app.post('/deletee2', async (요청, 응답)=>{
    var 비교1 = JSON.stringify(요청.user._id)
    var 비교2 = JSON.stringify(요청.body.userId)
    if(비교1 == 비교2){
        await db.collection('comment').deleteOne({ _id : new ObjectId(요청.body.id)})
    }
    else {
        응답.send("지울 수 없성")
    }
})
app.post('/addlike', async (요청, 응답)=>{
    await db.collection('post').updateOne({ _id : new ObjectId(요청.body.postid)}, {$inc : {like : 1}})
})

// app.get('/dele', async (요청, 응답)=>{
//     await db.collection('message').deleteMany({parent : null})
//     응답.redirect('/list/1')
// })

// app.get('/socket', function(요청, 응답){
//     응답.render('socket.ejs')
// })

// io.on('connection', function(socket){
//     console.log('유저 접속됨');

//     socket.on('joinroom', function(data){
//         socket.join('room1');
//     });

//     socket.on('user-send', function(data){
//         console.log(data);
//         io.emit('broadcast', data); // 참여자 전원에게
//         // io.to(socket.id).emit('broadcast', data) //1:1
//     });

//     socket.on('room1-send', function(data){
//         io.to('room1').emit('broadcast', data)
//     });   


// })