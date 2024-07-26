const axios = require('axios');
const sharp = require('sharp');

// 썸네일 이미지 최적화
async function optimizeImage(imageUrl, w, h) {
    try {
        const imageBuffer = await axios.get(`https://ddenzubucket.s3.ap-northeast-2.amazonaws.com/${imageUrl}`, { responseType: 'arraybuffer' })
        .then(response => Buffer.from(response.data));
        const optimizedImageBuffer = await sharp(imageBuffer)
            .rotate()
            .resize({ width: w, height: h, fit: 'cover' })
            .toBuffer();
        return `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
    } catch (error) {
        console.error("이미지 파일 최적화 실패", error);
        throw error;
    }
}

async function optimizeThumbnail(items) {
    return await Promise.all(
        items.map(async (item) => {
            if (item.imgName) {
                return await optimizeImage(Array.isArray(item.imgName) ? item.imgName[0] : item.imgName, 75, 85);
            }
            return ''; // 빈 문자열 추가
        })
    );
};

module.exports = optimizeThumbnail;