const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '9h' });
}

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
}

const verifyToken = (token,secret) =>{
    return jwt.verify(token,secret);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
};