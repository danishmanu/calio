const User = require("../models/User")
require("dotenv").config()
const mongoose=require('mongoose')
// const Otp_collection=require("../models/otp")
const Address = require("../models/Address");
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Razorpay=require("razorpay");
const Coupon = require("../models/Coupon");
const Wallet = require('../models/Wallet');
const crypto = require('crypto'); 

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
exports.verifyWallet= async (req, res) => {
  const {  amount } = req.body;

 let wallet =await Wallet.findOne({user_Id:req.session.user})
 if(!wallet){
  res.status(401).json({messaee:"wallet not found"})
 }

 wallet.balance+=parseFloat(amount);
 const options = { 
  day: '2-digit', 
  month: 'short', 
  year: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit', 
  hour12: true 
};
const formattedDate = new Date().toLocaleString('en-GB', options).replace(',', '');

 history={
  amount:amount,
  status:'credit',
  description:`${amount} is credited to wallet via razorpay at ${formattedDate}`
 }
 wallet.history.push(history)
 wallet.save()
 res.status(200).json({message:'Payment verified and funds added to wallet.'});
 
};
exports.getCheckout=async(req,res)=>{
    try{

        const user=req.session.user
      
         const addresses=await Address.findOne({user_Id:user})
        const cart=await Cart.findOne({user_Id:user}).populate("items.product_Id")
        if(!cart){
        res.redirect("/")
        }
        const appliedCoupon = await Coupon.findOne({
          "users.user_Id": user,
          "users.isBought": false
      });
      const applicableCoupons =await Coupon.find({$and:[{isDelete:false},{minAmount:{$lte:cart.total_price}}, { startDate: { $lte: new Date() } },  { endDate: { $gte: new Date() } }, ]});
         res.render("users/checkout",{user,addresses,cart,appliedCoupon,coupons:applicableCoupons})
     
    
    }
    catch(error){
        console.error(error)
    }
}


exports.checkout = async (req, res) => {
  try {
      const user = req.session.user;
      const { address_Id, paymentMethod } = req.body;

      if (!user) {
          return res.status(400).json({ message: 'User not found in session' });
      }
      if (!address_Id || !paymentMethod) {
          return res.status(400).json({ message: 'Missing required fields' });
      }

      const addressess = await Address.findOne({ user_Id: user });
      if (!addressess) {
          return res.status(404).json({ message: 'User address not found' });
      }

      let curaddress = addressess.address.find(item => item._id.toString() === address_Id);
      if (!curaddress) {
          return res.status(404).json({ message: 'Address not found' });
      }

      const cart = await Cart.findOne({ user_Id: user }).populate("items.product_Id");
      if (!cart || cart.items.length === 0) {
          return res.status(400).json({ message: 'Cart is empty' });
      }

      let discount = 0;
      const coupon = await Coupon.findOne({
          "users.user_Id": user,
          "users.isBought": false
      });
      if (coupon) {
          discount = coupon.discount;
      }

      // Handling COD payment
      if (paymentMethod === "COD") {
          const totalAmount = cart.items.reduce((acc, item) => {
              const price = item.product_Id.offer?.discountPercentage
                  ? item.product_Id.price - item.product_Id.price * (item.product_Id.offer.discountPercentage / 100)
                  : item.product_Id.price;
              return acc + price * item.quantity;
          }, 0);

          const payableAmount = totalAmount - (totalAmount * discount / 100);

          if (payableAmount >= 10000) {
              return res.status(401).json({ message: 'Cash on delivery is only applicable to orders below 10000', cod: false });
          }

          const order = new Order({
              user_Id: cart.user_Id,
              deliveryAddress: {
                  name: user.username,
                  phone: curaddress.phone,
                  address_line: curaddress.address_line,
                  pincode: curaddress.pincode,
                  state: curaddress.state,
                  city: curaddress.city,
                  country: curaddress.country
              },
              items: cart.items.map(item => ({
                  product_Id: item.product_Id._id,
                  productName: item.product_Id.name,
                  quantity: item.quantity,
                  image: item.product_Id.images[0],
                  price: item.product_Id.offer?.discountPercentage
                      ? item.product_Id.price - item.product_Id.price * (item.product_Id.offer.discountPercentage / 100)
                      : item.product_Id.price
              })),
              discount,
              totalAmount,
              payableAmount,
              paymentMethod,
              paymentStatus: false
          });

          for (const item of cart.items) {
              const product = await Product.findById(item.product_Id);
              if (product.stock < item.quantity) {
                  return res.status(400).json({ message: 'Not enough stock for product' });
              }
              await Product.findByIdAndUpdate(
                  item.product_Id,  
                  { $inc: { stock: -item.quantity } }, 
                  { new: true }
              );
          }

          await order.save();

          await Cart.updateOne({ user_Id: user }, { $set: { items: [] } });

          return res.status(200).json({ message: 'Order placed successfully', cod: true });
      }

      // Handling Razorpay payment
      if (paymentMethod === "RAZORPAY") {
          const totalAmount = cart.items.reduce((acc, item) => {
              const price = item.product_Id.offer?.discountPercentage
                  ? item.product_Id.price - item.product_Id.price * (item.product_Id.offer.discountPercentage / 100)
                  : item.product_Id.price;
              return acc + price * item.quantity;
          }, 0);

          const payableAmount = totalAmount - (totalAmount * discount / 100);

          const razorpayOrder = await razorpay.orders.create({
              amount: Math.round(payableAmount * 100), // Razorpay requires amount in paise
              receipt: `receipt_${cart.user_Id}`,
              currency: "INR"
          });

          return res.status(200).json({
              message: "Razorpay order created successfully",
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
              razorpayOrderId: razorpayOrder.id,
              razor: true,
              key: process.env.RAZORPAY_KEY_ID
          });
      }

  } catch (error) {
      console.error('Error during order placement:', error);
      return res.status(500).json({ message: 'Server error' });
  }
};
exports.updatePaymentStatus = async (req, res) => {
  try {
      const { orderId, paymentId, addressId, razorpaySignature, razorpayOrderId } = req.body;
      const user = req.session.user;

      const generatedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(`${razorpayOrderId}|${paymentId}`)
          .digest('hex');

      const isPaymentVerified = (generatedSignature === razorpaySignature && paymentId);

    
      const cart = await Cart.findOne({ user_Id: user }).populate('items.product_Id');
      if (!cart || cart.items.length === 0) {
          return res.status(400).json({ message: 'Cart is empty' });
      }

      
      const addresses = await Address.findOne({ user_Id: user });
      if (!addresses) {
          return res.status(404).json({ message: 'User address not found' });
      }

      const curaddress = addresses.address.find(item => item._id.toString() === addressId);
      if (!curaddress) {
          return res.status(404).json({ message: 'Address not found' });
      }

      const users = await User.findOne({ _id: user });

      // Calculate discount
      let discount = 0;
      const coupon = await Coupon.findOne({
          "users.user_Id": user,
          "users.isBought": false
      });
      if (coupon) {
          discount = coupon.discount;
      }

      const totalAmount = cart.items.reduce((acc, item) => acc + item.product_Id.price * item.quantity, 0);
      const payableAmount = totalAmount - discount;

      // Create order
      const order = new Order({
          user_Id: cart.user_Id,
          deliveryAddress: {
              name: users.username,
              phone: curaddress.phone,
              address_line: curaddress.address_line,
              pincode: curaddress.pincode,
              state: curaddress.state,
              city: curaddress.city,
              country: curaddress.country
          },
          items: cart.items.map(item => ({
              product_Id: item.product_Id._id,
              productName: item.product_Id.name,
              quantity: item.quantity,
              image: item.product_Id.images[0],
              price: item.product_Id.offer && item.product_Id.offer.discountPercentage
                  ? item.product_Id.price - item.product_Id.price * (item.product_Id.offer.discountPercentage / 100)
                  : item.product_Id.price
          })),
          discount,
          totalAmount,
          payableAmount,
          paymentMethod: 'RAZORPAY',
          paymentStatus: isPaymentVerified ? true : false 
      });

      await order.save();

    
      await Cart.updateOne({ user_Id: user }, { $set: { items: [] } });

      if (!isPaymentVerified) {
          return res.status(200).json({ message: 'Payment failed, but order placed successfully', orderPlaced: true });
      }

      return res.status(200).json({ message: 'Payment verified and order placed successfully', orderPlaced: true });

  } catch (error) {
      console.error('Error updating payment status:', error);
      return res.status(500).json({ message: 'Server error while updating payment status' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    console.log("here")
      const { product_Id,order_Id } = req.body;
      console.log(order_Id)
      
const order = await Order.findOne({ user_Id:req.session.user,_id:order_Id,"items.product_Id": product_Id });
console.log(order)
      if (!order) {
        console.log("here2")
          return res.status(404).json({ message: 'Order not found' });
      }

      console.log("here3")
      const item = order.items.find(item => item.product_Id.toString() === product_Id);

      if (!item) {
        console.log("here4")
          return res.status(404).json({ message: 'Product not found in the order' });
      }

      
      if (item.orderStatus === 'delivered') {
        console.log("here5")
          return res.status(400).json({ message: 'Delivered orders cannot be canceled' });
      }

      if (item.orderStatus === 'canceled') {
        console.log("here6")
          return res.status(400).json({ message: 'Order is already canceled' });
      }

      console.log()
     
      item.orderStatus = 'canceled';
      if(item.paymentStatus==true){
        let wallet=await Wallet.findOne({user_Id:order.user_Id})
        if(!wallet){
          const newWallet = new Wallet({
            userId: order.user_Id,
            balance: item.price,  
            history: [{
                amount: item.price,
                status: 'credit',
                description: `Refund for canceled product ${item.productName}`
            }]
        });
        console.log("here7")
        await newWallet.save();
    } else {
      console.log("here8")
      wallet.balance += item.price; 
      wallet.history.push({
            amount: item.price-item.price*(item.discount/100),
            status: 'credit',
            description: `Refund for canceled product ${item.productName}`
        });
        await userWallet.save();
    }
}
console.log("here9")
      
      await order.save();

     
      return res.status(200).json({ message: 'Order canceled successfully' });
  } catch (error) {
      console.error('Error canceling order:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};
exports.removeCoupon = async (req, res) => {
  const couponCode = req.params.couponCode;
  const userId = req.session.user;
console.log("dfhfhhirguigruifuisgui")
  try {
    const coupon = await Coupon.findOne({ coupon_code: couponCode, isDelete: false });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

   
    coupon.users = coupon.users.filter(user => user.user_Id.toString() !== userId.toString());
    await coupon.save();

    return res.status(200).json({ success: true, message: "Coupon removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "An error occurred while removing the coupon" });
  }
};

exports.applyCoupon = async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.session.user; 
  const curDate = new Date();

  try {
    const coupon = await Coupon.findOne({ coupon_code: couponCode, isDelete: false });

    if (!coupon) {
      return res.status(401).json({ coupon: false, message: "Coupon not found" });
    }

    if (coupon.startDate > curDate) {
      return res.status(401).json({ coupon: false, message: `Coupon starts on ${coupon.startDate.toLocaleString()}` });
    }

    if (coupon.endDate < curDate) {
      return res.status(401).json({ coupon: false, message: "Coupon is expired" });
    }

    
    const userAlreadyUsedCoupon = coupon.users.some(user => user.user_Id.toString() === userId.toString()&& user.isBought === true);

    if (userAlreadyUsedCoupon) {
      return res.status(400).json({ coupon: false, message: "You have already used this coupon." });
    }

    
    coupon.users.push({ user_Id: userId, isBought: false });
    await coupon.save();

    return res.status(200).json({
      coupon: true,
      message: "Coupon applied successfully",
      discountAmount: coupon.discount,
      coupon_code: coupon.coupon_code
    });
  } catch (error) {
    return res.status(500).json({ coupon: false, message: "An error occurred while applying the coupon" });
  }
};


