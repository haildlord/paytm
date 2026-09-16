const express = require("express");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const {userModel, accountModel} = require("../../db");
const {JWT_SECRET} = require("../../backend/config")
const {authMiddleware} = require("../middleware.js");

const router = express.Router();

const signupBody = zod.object({
    userName: zod.string().email(),
	firstName: zod.string().trim().min(3),
	lastName: zod.string().trim().min(3),
	password: zod.string().trim().min(3)
})

const updateBody = zod.object({
    firstName: zod.string().trim().min(3).optional(),
    lastName: zod.string().trim().min(3).optional(),
    password: zod.string().trim().min(3).optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});

function inputValidation(path) {
    return (req, res, next) => {
        try{
            const {success} = path === 'signup'
                ? signupBody.safeParse(req.body)
                : updateBody.safeParse(req.body);
        
            if(!success){
                return res.status(411).json({
                    message: "Incorrect inputs"
                })    
            }
        
            next();
            
        }catch(err){
            const customErr = new Error(`InputValidation : some error happened while checking for input : ${err}`);
            next(customErr)
        }
    }
}

async function emailCheck(req, res, next) {
    const { userName } = req.body; 

    try {
        const existingUser = await userModel.findOne({ userName }).exec();

        if (existingUser) {
            return res.status(411).json({
                message: "Email already taken"
            });    
        }

        next();
        
    } catch(err) {
        const customErr = new Error(`Database failed while checking email: ${err.message}`);
        customErr.location = "emailCheck Middleware";
        next(customErr);
    }
}

async function existingUser(req, res, next){

    const userName = req.body.userName;
    const userPassword = req.body.password;

    if(!userName || !userPassword){
        return res.status(411).json({
            message: "Invalid Inputs"
        });      
    }

    try{
        const {_id, password} = await userModel.findOne({
            userName
        }).exec();

        req.userId = _id;
        req.hashedPassword = password;

        next();
    }catch(err){
        const customErr = new Error(`error while finding existing user : ${err}`);
        next(customErr);
    }
}

router.post('/signup', inputValidation('signup'), emailCheck, async (req, res) => {
    const {userName, firstName, lastName, password} = req.body;

    try{
        const hashedPassword = await bcrypt.hash(password, 10);
        const userDoc = new userModel({
            userName,
            firstName,
            lastName,
            password: hashedPassword,
        });

        const savedUser = await userDoc.save();
        const jwtString = jwt.sign({ userId: savedUser._id }, JWT_SECRET);

        const userAccount = new accountModel({
            userId: savedUser._id,
            balance:  Math.floor(Math.random() * 10000) + 1 
        })
        await userAccount.save();

        return res.status(200).json({
            token: jwtString,
            message: "User created successfully",
        });

    }catch(err){
        res.status(411).json({
            message: "Error while Signing up",
            error: err
        })
    }
})

router.post('/signin', existingUser, async (req, res) => {
    const {password} = req.body;
    const {hashedPassword, userId} = req;

    try{

        const ok = await bcrypt.compare(password, hashedPassword);

        if (!ok) {
            return res.status(411).json({
                message: "Password doesnot match"
            });
        }

        const jwtString = jwt.sign({ userId: userId }, JWT_SECRET);

        return res.status(200).json({
            message: "Login Successfull",
            token: jwtString
        })

    }catch(err){
        res.status(411).json({
            message: "Error while Signining",
            error: err
        })
    }
})

router.put('/update', authMiddleware, inputValidation('update'), async (req, res) => {
    const {firstName, lastName, password} = req.body;
    
    try{
        const update = {};
        if (firstName !== undefined) update.firstName = firstName;
        if (lastName !== undefined) update.lastName = lastName;
        if (password !== undefined) update.password = await bcrypt.hash(password, 10);

        await userModel.updateOne({ _id: req.userId }, update);

        return res.status(200).json({
            message: "Updated successfully",
        })
    }catch(err){
        res.status(411).json({
            message: "Error while updating information",
            error: err
        })
    }
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    try {
        // Use Regex for partial search functionality
        const users = await userModel.find({
            $or: [
                { firstName: { "$regex": filter, "$options": "i" } }, // "i" makes it case-insensitive!
                { lastName: { "$regex": filter, "$options": "i" } }
            ]
        });

        // Map the results so you don't leak passwords or sensitive data
        return res.status(200).json({
            users: users.map(user => ({
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                _id: user._id
            }))
        });

    } catch (err) {
        // Use your excellent error handling
        return res.status(500).json({
            message: "Error while searching for users"
        });
    }
});

module.exports = router;