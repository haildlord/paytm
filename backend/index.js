require("dotenv").config();

const express = require("express");
const rootRouter = require("./routes/index");

const cors = require("cors");

const app = new express();

// middlewares :
app.use(cors());

app.use(express.json());

app.use("/api/v1", rootRouter);

app.use((err, req, res, next) => {

    const statusCode = err.statusCode || 500;
    const message    = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success : false,
        message : message 
    });
    
})


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`listing at ${PORT}`);
})





