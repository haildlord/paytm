const express = require("express");
const {mongoose, accountModel, userModel} = require("../../db");
const {authMiddleware} = require('../middleware');

const router = express.Router();

router.get('/user-info', authMiddleware, async (req, res) => {
    try {

        const userid = req.userid;

        const usersAccountInfo = await accountModel.findOne({ userid });
        const usersInfo = await userModel.findOne({ _id: userid });

        if (!usersAccountInfo || !usersInfo) {
            return res.status(404).json({
                message: "User or account not found"
            });
        }

        res.status(200).json({
            balance : usersAccountInfo.balance,
            firstname : usersInfo.firstname,
            lastname : usersInfo.lastname,
            username : usersInfo.username,
            userid
        });

    } catch(err){
        res.status(500).json({
            message: `Error while fetching users info: ${err.message}`
        });
    }
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const { amount, to } = req.body;

        // Fetch the accounts within the transaction
        const account = await accountModel.findOne({ userid: req.userid }).session(session);

        if (!account || account.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        const toAccount = await accountModel.findOne({ userid: to }).session(session);

        if (!toAccount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid account"
            });
        }

        // Perform the transfer
        await accountModel.updateOne({ userid: req.userid }, { $inc: { balance: -amount } }).session(session);
        await accountModel.updateOne({ userid: to }, { $inc: { balance: amount } }).session(session);

        // Commit the transaction
        await session.commitTransaction();
        res.json({
            message: "Transfer successful"
        });
    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        res.status(500).json({
            message: `Transfer failed: ${err}`
        });
    } finally {
        session.endSession();
    }
});


module.exports = router;
