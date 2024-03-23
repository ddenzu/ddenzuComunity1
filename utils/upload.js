const { S3Client } = require('@aws-sdk/client-s3')
const multer = require('multer')
const multerS3 = require('multer-s3')
const s3 = new S3Client({
    region: 'ap-northeast-2',
    credentials: {
        accessKeyId: process.env.S3_KEY,
        secretAccessKey: process.env.S3_SECRET,
    }
})

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'ddenzubucket',
        key: function (요청, file, cb) {
            cb(null, Date.now() + file.originalname) //업로드시 파일명 변경가능 겹치면안됨
        }
    })
})

module.exports = upload;