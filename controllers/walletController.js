const User = require("../models/User")
const Wallet=require("../models/Wallet")
const Razorpay=require("razorpay")


const razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
  })

exports.addToWallet = async (req, res) => {
    const { amount } = req.body;
  
    try {
        const options = {
            amount: amount * 100, 
            currency: 'INR',
            receipt: 'receipt#1',
            payment_capture: 1 
        };
  
        const order = await razorpay.orders.create(options);
        
        res.json({
            ...order,
            key_Id: razorpay.key_id 
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send('Internal Server Error');
    }
  };
  exports.verifyWallet = async (req, res) => {
    const { amount } = req.body;

    try {
        let wallet = await Wallet.findOne({ user_Id: req.session.user });
        if (!wallet) {
            return res.status(401).json({ message: "Wallet not found" });
        }

        wallet.balance += parseFloat(amount);
        const options = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        const formattedDate = new Date().toLocaleString('en-GB', options).replace(',', '');

        const history = {
            amount: amount,
            status: 'credit',
            description: `${amount} is credited to wallet via Razorpay at ${formattedDate}`
        };

        wallet.history.push(history);
        await wallet.save(); 

        res.status(200).json({ message: 'Payment verified and funds added to wallet.' });
    } catch (error) {
        console.error('Error verifying wallet:', error);
        res.status(500).send('Internal Server Error');
    }
};

