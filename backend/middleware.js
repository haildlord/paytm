const { JWT_SECRET } = require("./config");
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next){
    const {authorization} = req.headers;

    if(!authorization || !authorization.startsWith('Bearer')){
        return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authorization.split(" ")[1];
    if(!token){
        return res.status(401).json({ message: "Missing or invalid token" });
    }

    try{
        const success = jwt.verify(token, JWT_SECRET);
        if(!success){
            return res.status(401).json({
                message: "Token Verification Failed"
            })
        }

        const {userId} = jwt.decode(token);
        req.userId = userId;

        next()
    }catch(err){
        const customErr = new Error(`Error While verifying token : ${err}}`);
        next(customErr);   
    }
}


module.exports = {
    authMiddleware
}