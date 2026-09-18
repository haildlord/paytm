const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);

// schema
const userSchema = new mongoose.Schema({
    username: {
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
    firstname: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastname: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50       
    }
});

const accountSchema = new mongoose.Schema({
    userid:{
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