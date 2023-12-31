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
const dateFormat1 = require("./public/time.js");

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
  cookie : { maxAge : 30 * 60 * 1000  }, // 로그인 시간 유지
  store: MongoStore.create({
    mongoUrl : process.env.DB_URL,
    dbName: 'forum',
  })
}))
app.use(passport.session()) 

let db
const url = process.env.DB_URL
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
  http.listen(process.env.PORT,'0.0.0.0', () => {
    console.log("http://localhost:"+process.env.PORT+" 에서 서버 실행중")
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
}) // 유저가 보낸 쿠키를 분석(세션데이터랑 비교)하는 로직 , 이제 api 에서 (요청.user) 사용가능
// ---------------------------------------------------------------------
app.get('/', (요청, 응답) => {
    console.log("client IP: " +requestIp.getClientIp(요청));
    console.log("time : "+new Date())
    응답.redirect('/list/1')
}) 
app.get('/list', async (요청, 응답) => {
    let result = await db.collection('post').find().toArray() // await = blocking
    // ejs 파일은 sendFile 아니라 render 사용
    응답.redirect('/list/1')
}) 

// multer 라이브러리 세팅
// let multer = require('multer');
// const sharp = require("sharp");
// const fs = require('fs');
// const { configDotenv } = require('dotenv')
const path = require('path');
// var storage = multer.diskStorage({
//   destination : function(req, file, cb){
//     cb(null, './public/image') // 이미지 어디에 저장할건지
//   },
//   filename : function(req, file, cb){
//     cb(null, Date.now()+file.originalname) // 파일명 설정하기
//   },
// //   filefilter : function(req, file, cb){

// //   }
// });

// var upload = multer({storage : storage}); // 갖다 쓰면됨

const { S3Client } = require('@aws-sdk/client-s3')
const multer = require('multer')
const multerS3 = require('multer-s3')
const s3 = new S3Client({
  region : 'ap-northeast-2',
  credentials : {
      accessKeyId : process.env.S3_KEY,
      secretAccessKey : process.env.S3_SECRET,
  }
})

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'ddenzubucket',
    key: function (요청, file, cb) {
      cb(null, Date.now()+file.originalname) //업로드시 파일명 변경가능 겹치면안됨
    }
  })
})


function checkLogin(요청, 응답, next) {
    if (요청.user) {
        next()
    }
    else {
        응답.send("<script>alert('로그인 요망');window.location.replace(`/login`)</script>");
    }
}

app.get('/write', async (요청, 응답) => {
    if (!요청.user){
        응답.send("<script>alert('로그인 요망');window.location.replace(`/login`)</script>");
    }
    else {
        let result = await db.collection('user').findOne({ username : 요청.user.username})
        if (요청.user.username==result.username){
            응답.render('write.ejs')
        }
        else {
            응답.send("<script>alert('로그인 요망');window.location.replace(`/login`)</script>");
        }
    }
})

app.post('/write', upload.single('img1'), async (요청, 응답) => { 
    try {
        if (요청.body.title==""||요청.body.content==""){
            return 응답.send('내용이 존재하지 않습니다');
        } 
        const postDetails = {
            title: 요청.body.title,
            content: 요청.body.content,
            작성자_id: 요청.user._id,
            작성자: 요청.user.username,
            like: 0,
            date: dateFormat1.dateFormat(new Date())
        }
        if (요청.file==undefined){ // 글만 썼을 때
            await db.collection('post').insertOne(postDetails);
        }
        else { // 이미지 OR 영상 첨부 했을 때
            if(요청.file.mimetype=='video/mp4' || 요청.file.mimetype=='video/quicktime'){
                postDetails.vidName = 요청.file.key;
            }
            else {
                postDetails.imgName = 요청.file.key;      
            }
            await db.collection('post').insertOne(postDetails);
        }
        응답.redirect('/list/1'); // redirect 하면 url 로 GET 요청을 자동으로 해줌, 그래서  { 글목록 : result} 이런거 안줘도됨   
    } catch(e) {
        console.log(e);
        응답.status(500).send('서버에러');
    }
})

app.post('/profileImg', upload.single('img1'), async (req, res, next) => {
    try {
        await db.collection('user').updateOne({ _id : new ObjectId(req.user._id)}, {$set : {imgName : req.file.key}})
        await db.collection('comment').updateMany({userId: new ObjectId(req.user._id)}, {$set : {userprofile : req.file.key}})
        return res.send("<script>alert('프로필 사진이 변경되었습니다');window.location.replace(`/mypage`);</script>");
     } catch (err) {
        console.log(err);
        res.status(500).send('서버 에러');
     }
  });


app.get('/detail/:id', async (요청, 응답)=>{
    // 요청.params 하면 유저가 url 파라미터에 입력한 데이터 가져옴(:id)
    try {
        let result = await db.collection('post').findOne({ _id : new ObjectId(요청.params.id)})
        if (!result) {
            return 응답.status(400).send('이상한 url')
        } 
        let result2 = await db.collection('comment').find({ postId : new ObjectId(요청.params.id), parentId : null}).toArray()
        let result3 = await db.collection('user').findOne({ _id : result.작성자_id})
        let result4 = await db.collection('comment').find({ postId : new ObjectId(요청.params.id), parentId : { $exists: true }}).toArray()
        var 현재접속자 = 요청.user ? 요청.user.username : 'noUser';
        const 이미지주소 = result.imgName ? `https://ddenzubucket.s3.ap-northeast-2.amazonaws.com/${result.imgName}` : '';
        const 동영상주소 = result.vidName ? `https://ddenzubucket.s3.ap-northeast-2.amazonaws.com/${result.vidName}` : '';
        const 프로필 = result3.imgName ? result3.imgName : '';
        응답.render('detail.ejs', {
            글목록: result,
            댓글목록: result2,
            이미지주소,
            프로필,
            동영상주소,
            현재접속자,
            dateFormat1,
            대댓글: result4
        });
    }
    catch(e) {
        console.log(e)
        응답.status(400).send('이상한 url') //500 => 서버문제 , 400 => 유저문제
    }
})

app.get('/edit/:id',checkLogin, async (요청, 응답)=>{   
    try {
        const result = await db.collection('post').findOne({ _id : new ObjectId(요청.params.id)})
        if (!result) {
            return 응답.status(404).send('게시글을 찾을 수 없음');
        }
        응답.render('edit.ejs', {result});
    } catch(error) {
        console.log(error);
        응답.status(500).send('서버 에러');
    }
})

app.put('/edit', async (요청, 응답) => {
    try{
        let 아이디비교용 = JSON.stringify(요청.body.userId)
        if(아이디비교용===JSON.stringify(요청.user._id)){
            const updatedPost = {
                title: 요청.body.title,
                content: 요청.body.content
            };
            await db.collection('post').updateOne({ _id : new ObjectId(요청.body.id)}, {$set : updatedPost})
            응답.redirect('/list/1');
        }
        else {
            응답.send("<script>alert('수정할 수 없슴다');window.location.replace(`/list/1`)</script>");
        }
    }  catch(e) {
        console.log(e);
        응답.status(500).send('서버 에러');
    }
})

app.delete('/delete', async (요청, 응답)=>{
    // console.log(요청.query) // 게시물id
    if (!요청.user) {
        return 응답.send('notLogin');
    }
    try{
        let result = await db.collection('post').deleteOne({작성자 : 요청.user.username, _id : new ObjectId(요청.query.docid)})
        if (result.deletedCount != 0){
            응답.send('삭제완료'); // ajax 요청 뒤에 redirect render 사용 x (장점사라짐) 
        }
        else {
            응답.send('cant');
        }
    } catch (e){
        console.log(e)
        응답.send('serverError');
    }
})

app.get('/list/:num', async (요청, 응답) => {
    console.log("client IP: " +requestIp.getClientIp(요청));
    try{
        let result = await db.collection('post').find().sort({ _id: -1 }).skip((요청.params.num-1)*5).limit(5).toArray()
        let cnt = await db.collection('post').count();
        const 채팅사람 = 요청.user ? 요청.user.username : "익명";
        응답.render('list.ejs', { 글목록: result, 글수: cnt, 채팅사람, 페이지넘버: 요청.params.num });
    } catch(e) {
        console.log(e);
        응답.status(500).send('서버 에러');
    }
}) 

app.get('/list/next/:num', async (요청, 응답) => {
    console.log("client IP: " +requestIp.getClientIp(요청));
    try{
        let result = await db.collection('post')
        .find({_id : {$lt : new ObjectId(요청.params.num)}}).sort({ _id: -1 }).limit(5).toArray()
        let cnt = await db.collection('post').count();
        if(result.length<1){
            return 응답.send("<script>alert('다음페이지가 존재하지 않습니다.');window.location.replace(`/list/1`)</script>");
        }
        let 채팅사람 = 요청.user ? 요청.user.username : "익명";
        let 페이지넘버 = 요청.query.pageNum;
        응답.render('list.ejs', { 글목록: result, 글수: cnt, 채팅사람, 페이지넘버 });
    } catch(e){
        console.log(e);
        응답.status(500).send('서버 에러');
    }
}) 

app.get('/list/prev/:num', async (요청, 응답) => {
    console.log("client IP: " +requestIp.getClientIp(요청));
    try{
        let result = await db.collection('post')
        .find({_id : {$gt : new ObjectId(요청.params.num)}}).sort({}).limit(5).toArray()
        result.reverse(); // 몽고디비 sort가 잘 적용되지 않아서 reverse함수로 대체함
        let cnt = await db.collection('post').count();
        if(result.length<1){
            return 응답.send("<script>alert('이전페이지가 존재하지 않습니다.');window.location.replace(`/list/1`)</script>");
        }
        let 채팅사람 = 요청.user ? 요청.user.username : "익명";
        let 페이지넘버 = 요청.query.pageNum;
        응답.render('list.ejs', { 글목록: result, 글수: cnt, 채팅사람, 페이지넘버 });
    } catch(e) {
        console.log(e);
        응답.status(500).send('서버 에러');
    }
}) 

app.get('/search2', async (요청, 응답) => { // 검색기능2
    // console.log(요청.query.value)
    try {
        let 검색조건 = [
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
        ] 
        let result = await db.collection('post').aggregate(검색조건).toArray();
        if(result.length!=0){
            return 응답.render('search.ejs', { 글목록 : result})
        }
        응답.send("<script>alert('존재하지 않는 글');window.location.replace(`/list/1`)</script>");
    } catch(e){
        응답.status(500).send('서버에러')
    }
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
    try{
        if (!요청.user){
            return 응답.send("<script>alert('로그인 요망');window.location.replace(`/login`)</script>");
        }
        let result = await db.collection('user').findOne({ username : 요청.user.username});
        응답.render('mypage.ejs', { 아이디 : result });     
        
    } catch(e){
        console.error(e);
        응답.status(500).send('서버 에러');
    }
})

app.post('/change-name', async (요청, 응답) => { 
    try {
        let result = await db.collection('user').findOne({ username : 요청.body.name})
        if (result){
            return 응답.send("<script>alert('이미 존재하는 아이디 입니다');window.location.replace(`/mypage`);</script>");
        }
        await db.collection('user').updateOne({ _id : new ObjectId(요청.user._id)}, {$set : {username : 요청.body.name}})
        await db.collection('comment').updateMany({userId: new ObjectId(요청.user._id)}, {$set : {username : 요청.body.name}})
        await db.collection('post').updateMany({작성자_id: new ObjectId(요청.user._id)}, {$set : {작성자 : 요청.body.name}})
        return 응답.send("<script>alert('닉네임이 변경되었습니다');window.location.replace(`/mypage`);</script>");
    }
    catch(e){
        console.log(e)
        return 응답.status(500).send('서버에러')
    }
})

app.get('/register', async (요청, 응답) => {
    응답.render('register.ejs')
}) 

app.post('/register', async (요청, 응답) => {
    // 회원가입시 아이디 비번 조건 필터링기능 만들기
    try{
        let result = await db.collection('user').findOne({ username : 요청.body.username});
        if (result){
            return 응답.send("<script>alert('이미 존재하는 아이디입니다');location.replace(location.href);</script>");
        }
        let 해시 = await bcrypt.hash(요청.body.password, 10) // 10 이면 적당히 꼬은거
        await db.collection('user').insertOne({username : 요청.body.username, password : 해시});
        return 응답.redirect('/list/1')
    } catch(e){
        console.error(e);
        return 응답.status(500).send('서버 에러');
    }
})

app.get('/logout',function(요청, 응답){
    요청.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        응답.redirect('/list/1');
    });
});

app.get('/chatroom', checkLogin, async function(요청, 응답){
    try{
        if(요청.query.name==요청.user.username){
            return 응답.send("<script>window.location.replace('/chat')</script>");
        }
        let result = await db.collection('chatroom').findOne({ name : {$all:[요청.user.username,요청.query.name]}})
        if(result==null){
            var 저장할거 = {
                title : 요청.user.username+" 🤝 "+요청.query.name,
                member : [new ObjectId(요청.query.id), 요청.user._id],
                name : [요청.query.name, 요청.user.username],
                date : new Date()
            }
            await db.collection('chatroom').insertOne(저장할거)
            let result1 = await db.collection('chatroom').find({ member : 요청.user._id}).toArray()
            let result2 = await db.collection('chatroom').findOne({ name : {$all:[요청.user.username,요청.query.name]}})
            응답.render('chat.ejs', { data : result1, cur : 요청.user._id, arrow : result2._id})
        } else {
            let result1 = await db.collection('chatroom').find({ member : 요청.user._id}).toArray()
            let result2 = await db.collection('chatroom').findOne({ name : {$all:[요청.user.username,요청.query.name]}})
            응답.render('chat.ejs', { data : result1, cur : 요청.user._id, arrow : result2._id})
        }
    } catch(e){
        console.log(e);
        응답.status(500).send('서버에러')
    }
})

app.get('/chat', checkLogin, async function(요청, 응답){ // navbar에서 올 때
    let result = await db.collection('chatroom').find({ member : 요청.user._id}).toArray()
    응답.render('chat.ejs', { data : result, cur : 요청.user._id, arrow : 0})
})

app.post('/comment', checkLogin, async (요청, 응답)=>{
    try {
        if (!요청.body.content) {
            return 응답.send("댓글등록 실패");
        }
        var 저장할거 = {
            postId : new ObjectId(요청.body.parent), // 작성글 id
            content : 요청.body.content, // 채팅내용
            username : 요청.user.username,
            userId : 요청.user._id,
            userprofile : 요청.user.imgName,
            date : new Date(),
        };
        await db.collection('comment').insertOne(저장할거);
        응답.send('댓글저장');
    } catch(e) {
        console.log(e);
        응답.status(500).send('서버에러')
    }
})

app.post('/recomment', checkLogin, async (요청, 응답)=>{
    // console.log(요청.body)
    try {
        if (!요청.body.content) {
            return 응답.send("<script>alert('대댓글등록실패');</script>");
        }
        let 저장할거 = {
            postId : new ObjectId(요청.body.parent), // 작성글 id
            parentId : new ObjectId(요청.body.reparent),
            content : 요청.body.content, // 채팅내용
            username : 요청.user.username,
            userId : 요청.user._id,
            userprofile : 요청.user.imgName,
            date : new Date(),
        }
        await db.collection('comment').insertOne(저장할거);
        응답.send('대댓글저장');
    } catch(e) {
        console.log(e)
        응답.status(500).send('서버에러')
    }
})

app.post('/message', checkLogin, async function(요청, 응답){ // 수정필요
    // console.log(요청.body.content)
    try {
        if (!요청.body.content) {
            return 응답.send("메세지 전송 실패");
        };
        let 저장할거 = {
            parent : 요청.body.parent, // 채팅방의 id
            content : 요청.body.content, // 채팅내용
            userid : 요청.user._id, // 채팅 건 사람
            date : dateFormat1.dateFormat(new Date()),
        };
        let result = await db.collection('message').insertOne(저장할거);
        if(result){
            return 응답.send('성공');
        }
        else {
            return 응답.send("채팅 메시지를 저장하는데 문제가 발생함");
        }
    } catch (e){
        console.log(e)
        return 응답.status(500).send('서버 에러');
    }
})

app.get('/message/:id', checkLogin, function(요청, 응답){
    응답.writeHead(200, {
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
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

app.post('/delete-chat', async (요청, 응답)=>{
    try{
        if(!요청.body.삭제id){
            return res.status(400).send('삭제할 ID가 존재하지 않음');
        }
        await db.collection('chatroom').deleteOne({ _id : new ObjectId(요청.body.삭제id)});
        let result1 = await db.collection('chatroom').find({ member : 요청.user._id}).toArray();
        return 응답.render('chat.ejs', { data : result1, cur : 요청.user._id, arrow : 0});
    } catch(e) {
        console.error(e);
        return 응답.status(500).send('서버에러')
    }
})
app.post('/delete-comment', async (요청, 응답)=>{
    try {
        var 비교1 = JSON.stringify(요청.user._id)
        var 비교2 = JSON.stringify(요청.body.userId)
        if(비교1 == 비교2){
            const deletedComment = await db.collection('comment').deleteOne({ _id : new ObjectId(요청.body.id)})
            if(deletedComment){
                return 응답.send('success');
            } else {
                return 응답.send("fail");
            }
        } else {
            return 응답.send("fail");
        }
    } catch(e) {
        console.log(e)
        return 응답.status(500).send('서버에러')
    }
})

app.post('/add-like', async (요청, 응답)=>{
    db.collection('post').updateOne({ _id : new ObjectId(요청.body.postid)}, {$inc : {like : 1}}).then(()=>{
        응답.send("<script>reloadLike();</script>");
    })
})

io.on('connection', function(socket){
    socket.on('user-send', function(data){
        console.log(data);
        io.emit('broadcast', data); 
    });
})
