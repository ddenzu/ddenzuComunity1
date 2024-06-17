const axios = require('axios');
const sharp = require('sharp');

async function optimizeImage(imageUrl, w, h) {
    try {
        const imageBuffer = await axios.get(`https://ddenzubucket.s3.ap-northeast-2.amazonaws.com/${imageUrl}`, { responseType: 'arraybuffer' }).then(response => Buffer.from(response.data));
        // 이미지 최적화
        const optimizedImageBuffer = await sharp(imageBuffer)
            .rotate()
            .resize({ width: w, height: h, fit: 'cover' }) // 적절한 사이즈로 조정
            .toBuffer();
    
        // 최적화된 이미지를 base64로 인코딩하여 반환
        return `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
    } catch (error) {
        console.error("이미지 파일 최적화 실패", error);
        throw error;
    }
}

module.exports = optimizeImage;