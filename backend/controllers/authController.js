const { log } = require("winston");
const { signUpEmail, verifyOTP, login, refresh, logout } = require("../services/authService");
const logger = require("../config/logger.js");



const signUpEmailCtrl = async(req,res)=>{
    try {
        const result = await signUpEmail(req.body);
        logger.info("SignUp Success", { email: req.body.email });
        res.json(result);
    } catch (error) {
        logger.error("SignUp Failed", { error: error.message });
        res.status(400).json({ error: error.message });
    }
}

const verifyOTPCtrl = async(req,res)=>{
    try {
        const tokens = await verifyOTP(req.body);
        logger.info("OTP Verification Success", { email: req.body.email });
        res.json(tokens);
    } catch (error) {
        logger.error("Verify OTP Failed", { error: error.message });
        res.status(400).json({ error: error.message });
    }
}

const loginEmailCtrl = async(req,res)=>{
    try {
        const tokens = await login(req.body);
        logger.info("Login Success", { email: req.body.email });
        res.json(tokens);
    } catch (error) {
        logger.error("Login Email Failed", { error: error.message });
        res.status(400).json({ error: error.message });
    }
}

const refreshCtrl = async(req,res)=>{
    try {
        const {refreshToken} = req.body;

        if(!refreshToken || typeof refreshToken !== 'string'){
            return res.status(400).json({error:"Invalid refresh token"});
        }

        const tokens = await refresh(refreshToken);

        res.json({
            accessToken:tokens.accessToken,
            refreshToken:tokens.refreshToken
        });

    } catch (error) {
        logger.error("Refresh token Failed", { error: error.message, body:req.body });
        res.status(401).json({error:error.message});        
    }
}


const logoutCtrl = async(req,res)=>{
    try {
        await logout(req.user.userId);
        res.json({message:"Logout successful"});
    } catch (error) {
        logger.error("Logout Failed", { error: error.message });
        res.status(500).json({ error: error.message });
    }
}


module.exports={
    signUpEmailCtrl,
    verifyOTPCtrl,
    loginEmailCtrl,
    refreshCtrl,
    logoutCtrl
};