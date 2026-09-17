const express = require("express");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError.js");

const { userModel, accountModel } = require("../../db");
const { JWT_SECRET } = require("../../backend/config");
const { authMiddleware } = require("../middleware.js");

const router = express.Router();

const signupBody = zod.object({
    userName: zod.string().email(),
    firstName: zod.string().trim().min(3),
    lastName: zod.string().trim().min(3),
    password: zod.string().trim().min(3)
});

const updateBody = zod.object({
    firstName: zod.string().trim().min(3).optional(),
    lastName: zod.string().trim().min(3).optional(),
    password: zod.string().trim().min(3).optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});

// Middleware: Input Validation
function inputValidation(path) {
    return (req, res, next) => {
        try {
            const result = path === 'signup'
                ? signupBody.safeParse(req.body)
                : updateBody.safeParse(req.body);
        
            if (!result.success) {
                return next(new AppError("Incorrect or missing inputs", 400));
            }
            next();
        } catch (err) {
            next(new AppError(`Validation failed: ${err.message}`, 500));
        }
    }
}

// Middleware: Check if Email exists
async function emailCheck(req, res, next) {
    const { userName } = req.body; 

    try {
        const existingUser = await userModel.findOne({ userName }).exec();

        if (existingUser) {
            return next(new AppError("Email already taken", 409));    
        }

        next();
    } catch(err) {
        next(new AppError("Database error while checking email availability", 500));
    }
}

// Middleware: Verify user exists before sign-in
async function existingUser(req, res, next) {
    const { userName, password } = req.body;

    if (!userName || !password) {
        return next(new AppError("Username and password are required", 400));      
    }

    try {
        const user = await userModel.findOne({ userName }).exec();

        if (!user) {
            // 401 Unauthorized is standard for bad login credentials
            return next(new AppError("Invalid username or password", 401));
        }

        req.userId = user._id;
        req.hashedPassword = user.password;

        next();
    } catch(err) {
        next(new AppError("Database error while fetching user account", 500));
    }
}

// Route: Sign Up
router.post('/signup', inputValidation('signup'), emailCheck, async (req, res, next) => {
    const { userName, firstName, lastName, password } = req.body;

    try {
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
            balance: Math.floor(Math.random() * 10000) + 1 
        });
        await userAccount.save();

        return res.status(201).json({ // 201 Created
            message: "User created successfully",
            token: jwtString
        });

    } catch(err) {
        next(new AppError("An error occurred while creating the account", 500));
    }
});

// Route: Sign In
router.post('/signin', existingUser, async (req, res, next) => {
    const { password } = req.body;
    const { hashedPassword, userId } = req;

    try {
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (!isPasswordValid) {
            return next(new AppError("Invalid username or password", 401));
        }

        const jwtString = jwt.sign({ userId: userId }, JWT_SECRET);

        return res.status(200).json({
            message: "Login successful",
            token: jwtString
        });

    } catch(err) {
        next(new AppError("An error occurred during sign-in", 500));
    }
});

// Route: Update User
router.put('/update', authMiddleware, inputValidation('update'), async (req, res, next) => {
    const { firstName, lastName, password } = req.body;
    
    try {
        const update = {};
        if (firstName !== undefined) update.firstName = firstName;
        if (lastName !== undefined) update.lastName = lastName;
        if (password !== undefined) update.password = await bcrypt.hash(password, 10);

        await userModel.updateOne({ _id: req.userId }, update);

        return res.status(200).json({
            message: "Updated successfully",
        });
    } catch(err) {
        next(new AppError("An error occurred while updating the profile", 500));
    }
});

// Route: Get Bulk Users
router.get("/bulk", async (req, res, next) => {
    const filter = req.query.filter || "";

    try {
        const users = await userModel.find({
            $or: [
                { firstName: { "$regex": filter, "$options": "i" } }, 
                { lastName: { "$regex": filter, "$options": "i" } }
            ]
        });

        return res.status(200).json({
            users: users.map(user => ({
                username: user.userName,
                firstName: user.firstName,
                lastName: user.lastName,
                _id: user._id
            }))
        });

    } catch (err) {
        next(new AppError("An error occurred while fetching users", 500));
    }
});

module.exports = router;