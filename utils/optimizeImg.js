const axios = require('axios');
const sharp = require('sharp');

// 썸네일 이미지 최적화
async function optimizeImage(imageUrl, w, h) {
    try {
        const { data } = await axios.get(`https://ddenzubucket.s3.ap-northeast-2.amazonaws.com/${imageUrl}`, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(data);
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

async function optimizeThumbnail(postList) {
    const imageOptimizationPromises = postList.map(async (post) => {
        if (post) {
            const imageUrl = post ? post : '';
            if (imageUrl) {
                return await optimizeImage(imageUrl, 75, 85); // 원하는 너비와 높이로 조정
            }
        }
        return '';
    });
    return Promise.all(imageOptimizationPromises);
}

// 게시물에서 썸네일 url 추출
async function getThumbnail(postList) {
    const thumbailUrls = [];
    for (const post of postList) {
        if (post.imgName) {
            thumbailUrls.push(Array.isArray(post.imgName) ? post.imgName[0] : post.imgName);
        } else {
            thumbailUrls.push('');
        }
    }
    return thumbailUrls;
}

module.exports = {optimizeThumbnail, getThumbnail};