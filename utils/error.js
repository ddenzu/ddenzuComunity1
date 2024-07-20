const serverError = (err, res) => {
    console.error(err.stack);
    return res.status(500).send('서버 오류가 발생했습니다.');
};

module.exports = serverError;
