const serverError = (err, res) => {
    console.error(err.stack);
    return res.status(500).send('서버 에러');
};

module.exports = serverError;
