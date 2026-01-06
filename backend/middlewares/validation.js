const logger = require("../config/logger");

const validationMiddleware = (schema)=>(req,res,next)=>{
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        logger.error("validation error", { error: error.message });
        res.status(400).json({ error: error.message });
    }
}

module.exports= {validationMiddleware};