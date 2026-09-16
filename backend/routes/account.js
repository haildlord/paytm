const express = require("express");
const {mongoose, accountModel} = require("../../db");
const {authMiddleware} = require('../middleware');

const router = express.Router();

router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const usersAccountInfo = await accountModel.findOne({ userId })

        res.status(200).json({
            balance : usersAccountInfo.balance
        })

    } catch(err){
        res.status(401).json({
            message: `Error while fetching balance : ${err}`
        })
    }
})

router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const { amount, to } = req.body;

        // Fetch the accounts within the transaction
        const account = await accountModel.findOne({ userId: req.userId }).session(session);

        if (!account || account.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        const toAccount = await accountModel.findOne({ userId: to }).session(session);

        if (!toAccount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid account"
            });
        }

        // Perform the transfer
        await accountModel.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
        await accountModel.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

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
