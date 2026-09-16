const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);

// schema
const userSchema = new mongoose.Schema({
    userName: {
        type : String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6    
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50       
    }
});

const accountSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    balance: {
        type: Number,
        min: 0,
        validate:{
            validator : Number.isInteger,
            message: 'Balance must be an integer. Updated to : {VALUE}'
        }
    }
})

// schema -> model
const userModel = mongoose.model("User", userSchema);
const accountModel = mongoose.model("Account", accountSchema);

module.exports = {
    mongoose,
    userModel,
    accountModel
}
