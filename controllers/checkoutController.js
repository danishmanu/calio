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

exports.getCheckout=async(req,res)=>{
    try{

      console.log('get ch')
        const user=req.session.user
      
        const addresses=await Address.findOne({user_Id:user})
        const cart=await Cart.findOne({user_Id:user}).populate("items.product_Id")

        if(!cart || cart.items.length<=0){
        res.redirect("/")
        }
        for (const item of cart.items) {
          if (item.product_Id.isDelete) {
            req.flash("error",` ${item.product_Id.name} is Unavailable `)
            res.redirect('/cart')
          }
          if (item.product_Id.stock < item.quantity) {
            req.flash("error",`Not enough stock for ${item.product_Id.name} `)
            res.redirect('/cart')
          }
      }
      
        const appliedCoupon = await Coupon.findOne({
          "users.user_Id": user,
          "users.isBought": false
      });
      res.render("users/checkout",{user,addresses,cart,appliedCoupon})
      
    
    }
    catch(error){
        console.error(error)
    }
}


exports.checkout = async (req, res) => {
  try {
      const user =  await User.findOne({_id: req.session.user});
      const { address_Id, paymentMethod } = req.body;

      if (!user) {
          return res.status(400).json({ message: 'User not found' });
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

      for (const item of cart.items) {
        if (item.product_Id.isDelete) {
            return res.status(400).json({ message: `${item.product_Id.name} is unavailable` });
        }
        if (item.product_Id.stock < item.quantity) {
            return res.status(400).json({ message: `Not enough products for ${item.product_Id.name}` });
        }
    }

    const coupon = await Coupon.findOne({
      "users.user_Id": user,
      "users.isBought": false
  });
  
  let discount = 0;
  let discountAmount = 0;
  
  if (coupon) {
    if(coupon.isDelete==true){
      return res.status(400).json({ message: `Coupon not Found` });
    }
      const calculatedDiscount = (cart.total_price * coupon.discount) / 100;
      discountAmount = Math.min(calculatedDiscount, coupon.maxApplicableAmount);
      discount = coupon.discount; 
  }
  const totalAmount = cart.items.reduce((acc, item) => {
    const price = item.product_Id.offer?.discountPercentage &&item.product_Id.offer.expirAt>Date.now()
        ? item.product_Id.price - item.product_Id.price * (item.product_Id.offer.discountPercentage / 100)
        : item.product_Id.price;
    return acc + price * item.quantity;
}, 0);
const payableAmount = Number(totalAmount) - Number(discountAmount);
     
      if (paymentMethod === "COD") {
        
         

          if (payableAmount >= 1000) {
              return res.status(401).json({ message: 'Cash on delivery is only applicable to orders below 1000', cod: false });
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
                  price: item.product_Id.offer?.discountPercentage&&item.product_Id.offer.expirAt>Date.now()
                      ? item.product_Id.price - item.product_Id.price * (item.product_Id.offer.discountPercentage / 100)
                      : item.product_Id.price
              })),
              discount:discount,
              discountAmount:discountAmount,
              totalAmount,
              payableAmount,
              paymentMethod,
              paymentStatus: false
          });

          for (const item of cart.items) {
              const product = await Product.findOne({_id:item.product_Id,isDelete:false});
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
      if (paymentMethod === "WALLET") {
       

        let wallet = await Wallet.findOne({user_Id:req.session.user})
        console.log(wallet,payableAmount,typeof(wallet),typeof(payableAmount))
        if (!wallet || wallet.balance<payableAmount) {
            return res.status(400).json({ message: 'Insufficient balance in wallet.', wallet: false });
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
                price: item.product_Id.offer?.discountPercentage&&item.product_Id.offer.expirAt>Date.now()
                    ? item.product_Id.price - item.product_Id.price * (item.product_Id.offer.discountPercentage / 100)
                    : item.product_Id.price
            })),
            discount:discount,
            discountAmount:discountAmount,
            totalAmount,
            payableAmount,
            paymentMethod,
            paymentStatus: true
        });

        for (const item of cart.items) {
            const product = await Product.findOne({_id:item.product_Id,isDelete:false});
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
        
        wallet.balance-=parseFloat(payableAmount);
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
         amount:payableAmount,
         status:'debit',
         description:`${payableAmount} is debited from wallet for order${order.orderId} at ${formattedDate}`
        }
        wallet.history.push(history)
        wallet.save()
        await Cart.updateOne({ user_Id: user }, { $set: { items: [] } });

        return res.status(200).json({ message: 'Order placed successfully', wallet: true });
    }
      
      if (paymentMethod === "RAZORPAY") {
         const razorpayOrder = await razorpay.orders.create({
              amount: Math.round(payableAmount * 100), 
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

      
      let discount = 0;
      const coupon = await Coupon.findOne({
          "users.user_Id": user,
          "users.isBought": false
      });

     
      const totalAmount = cart.items.reduce((acc, item) => {
        const price = item.product_Id.offer?.discountPercentage &&item.product_Id.offer.expirAt>Date.now()
            ? item.product_Id.price - item.product_Id.price * (item.product_Id.offer.discountPercentage / 100)
            : item.product_Id.price;
        return acc + price * item.quantity;
    }, 0);
    console.log(totalAmount,"total")
  let discountAmount=0;
    if (coupon) {
      const calculatedDiscount = (totalAmount * coupon.discount) / 100;
      discountAmount=Math.min(calculatedDiscount, coupon.maxApplicableAmount);
    }
    console.log(discountAmount)
      const payableAmount =totalAmount - discountAmount;
      console.log(payableAmount,"update")
      
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
              price: item.product_Id.offer && item.product_Id.offer.discountPercentage &&item.product_Id.offer.expirAt>Date.now()
                  ? item.product_Id.price - item.product_Id.price * (item.product_Id.offer.discountPercentage / 100)
                  : item.product_Id.price
          })),
          discount,
          discountAmount,
          totalAmount,
          payableAmount,
          paymentMethod: 'RAZORPAY',
          paymentStatus: isPaymentVerified ? true : false 
      });

      await order.save();

     
    if (isPaymentVerified) {
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
    }
      await Cart.updateOne({ user_Id: user }, { $set: { items: [] } },{ $set: { total_price: '' } });

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
    
      const { product_Id,order_Id } = req.body;
   
const order = await Order.findOne({ user_Id:req.session.user,_id:order_Id,"items.product_Id": product_Id });
console.log(order)
      if (!order) {
      
          return res.status(404).json({ message: 'Order not found' });
      }

    
      const item = order.items.find(item => item.product_Id.toString() === product_Id);

      if (!item) {
     
          return res.status(404).json({ message: 'Product not found in the order' });
      }

      
      if (item.orderStatus === 'delivered') {
      
          return res.status(400).json({ message: 'Delivered orders cannot be canceled' });
      }

      if (item.orderStatus === 'canceled') {
     
          return res.status(400).json({ message: 'Order is already canceled' });
      }


     
      item.orderStatus = 'canceled';
      if(order.paymentStatus==true){

        const itemTotalPrice = item.price * item.quantity;
        const itemProportion = itemTotalPrice / order.totalAmount;
        const discountAmount = (order.discountAmount || 0) * itemProportion;
        const refundAmount = itemTotalPrice - discountAmount;

        let wallet=await Wallet.findOne({user_Id:order.user_Id})
        if(!wallet){
          const newWallet = new Wallet({
            userId: order.user_Id,
            balance:refundAmount,  
            history: [{
                amount: refundAmount,
                status: 'credit',
                description: `Refund for canceled product ${item.productName} in order:${order.orderId ?order.orderId:""} `
            }]
        });
      
        await newWallet.save();
    } else {
    
      wallet.balance += refundAmount; 
      wallet.history.push({
            amount: refundAmount,
            status: 'credit',
            description: `Refund for canceled product ${item.productName} in order:${order.orderId ?order.orderId:""} `
        });
        await wallet.save();
    }
}

      
let product = await Product.findByIdAndUpdate(
  item.product_Id,
  {
      $inc: { stock: item.quantity } 
  },
  { new: true } 
);
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

  try {
    const coupon = await Coupon.findOne({ coupon_code: couponCode });

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
  let cart=await Cart.findOne({user_Id:userId})
   
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
  
  if (coupon.minAmount > cart.total_price) {
      return res.status(400).json({ coupon: false, message: `Coupon applicable only for orders above ${coupon.minAmount}` });
  }

  const calculatedDiscount = (cart.total_price * coupon.discount) / 100;

 
  let discountAmount = Math.min(calculatedDiscount, coupon.maxApplicableAmount);
    
    coupon.users.push({ user_Id: userId, isBought: false });
    await coupon.save();

    return res.status(200).json({
      coupon: true,
      message: "Coupon applied successfully",
      discountAmount: discountAmount,
      maxApplicableAmount:coupon.maxApplicableAmount,
      discount:coupon.discount,
      coupon_code: coupon.coupon_code,
    
    });
  } catch (error) {
    console.error("Error applying coupon:", error); 
    return res.status(500).json({ coupon: false, message: "An error occurred while applying the coupon" });
  }
};


exports.getRepaymentDetails = async (req, res) => {
  try {
  
      const { orderId } = req.body;
     
      const order = await Order.findOne({_id:orderId});
     
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }
     

      
      if (order.paymentStatus) {
          return res.status(400).json({ message: 'Payment already completed for this order' });
      }

      for (const item of order.items) {
        const product = await Product.findById(item.product_Id);
        if(!product ||product.isDelete==true){
          return res.status(400).json({ message: 'product not found' });
        }
        if (product.stock < item.quantity) {
            return res.status(400).json({ message: 'Not enough stock for product' });
        }
      
    }
    console.log(typeof(order.payableAmount))
      const repayAmount =Math.round(Number(order.payableAmount)); 

     
      

      const razorpayOrder = await razorpay.orders.create({
          amount: repayAmount * 100,
          currency: "INR",            
          receipt: `receipt_order_${orderId}`, 
      });

    
      res.status(200).json({
          key: process.env.RAZORPAY_KEY_ID,
          amount: repayAmount,                
          currency: "INR",                    
          razorpayOrderId: razorpayOrder.id,  
          orderId: order._id,                 
      });
  } catch (error) {
      console.error('Error fetching repayment details:', error);
      res.status(500).json({ message: 'Server error while fetching repayment details' });
  }
};
exports.confirmRepayment = async (req, res) => {
  try {
      const { orderId, paymentId, razorpaySignature, razorpayOrderId } = req.body;

     
      const order = await Order.findById(orderId);
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }

     
      const generatedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(`${razorpayOrderId}|${paymentId}`)
          .digest('hex');

      
      const isPaymentVerified = (generatedSignature === razorpaySignature && paymentId);

      
      if (isPaymentVerified) {
        for (const item of order.items) {
          const product = await Product.findById(item.product_Id);
         
          await Product.findByIdAndUpdate(
            item.product_Id,  
            { $inc: { stock: -item.quantity } }, 
            { new: true }
        );
        
      }
          order.paymentStatus = true;
          await order.save();

          return res.status(200).json({
              message: 'Payment verified and order updated successfully',
              paymentVerified: true,
          });
      } else {
          return res.status(400).json({
              message: 'Payment verification failed',
              paymentVerified: false,
          });
      }
  } catch (error) {
      console.error('Error confirming repayment:', error);
      res.status(500).json({ message: 'Server error while confirming repayment' });
  }
};