const logger = require("../config/logger");
const { verifyToken } = require("../utils/jwt");


const authMiddleware = (req,res,next) =>{
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        logger.warn("No token provided");
        return res.status(401).json({error:"Unauthorized"});
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyToken(token,process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        logger.error("Invalid token",{err});
        res.status(401).json({error:"Invalid token"})
    }
};

module.exports = {
    authMiddleware
};