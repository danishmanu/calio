const User = require("../models/User")
require("dotenv").config()
// const Otp_collection=require("../models/otp")
const Address = require("../models/Address");
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Razorpay=require("razorpay")

const razorpay=new Razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_KEY_SECRET
})


exports.getCheckout=async(req,res)=>{
    try{
        const user=req.session.user
       
         const addresses=await Address.findOne({user_Id:user})
        const cart=await Cart.findOne({user_Id:user}).populate("items.product_Id")
        console.log(cart.items[0].product_Id)
         res.render("users/checkout",{user,addresses,cart})
     
    
    }
    catch(error){
        console.error(error)
    }
   

    


}


  
exports.checkout=async(req,res)=>{
    try {
      const user=req.session.user;

        const { address_Id, paymentMethod } = req.body;
        console.log(paymentMethod)
    console.log(req.body)
        if (!address_Id || !paymentMethod ) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        const addressess=await Address.findOne({user_Id:user})
        console.log(addressess)
        console.log(address_Id)
        
        curaddress=addressess.address.find(item=>item._id.toString()===address_Id)
        console.log(curaddress)
        const users=await User.findOne({_id:user})
        const cart=await Cart.findOne({user_Id:user}).populate("items.product_Id")
      
        const order=new Order({
          user_Id:cart.user_Id,
          deliveryAddress:{
            name:users.username,
            phone:curaddress.phone,
            address_line:curaddress.address_line,
            pincode:curaddress.pincode,
            state:curaddress.state,
            city:curaddress.city,
            country:curaddress.country
          },
          items:[],
          paymentMethod:paymentMethod,
          totalAmount:""
         


        })
        cart.items.forEach((item)=>order.items.push({ 
          product_Id:item.product_Id._id,
      productName:item.product_Id.name,
      quantity:item.quantity,
      image:item.product_Id.images[0],
      price:item.product_Id.price
    }))
   
    order.totalAmount=order.items.reduce((acc,item)=>acc+item.price*item.quantity,0)
        console.log( order.totalAmount)
        
      
       
        if(paymentMethod=="COD"){
          await order.save()
        order.items.forEach(async (item)=>{
          await Cart.updateOne(
            { user_Id: req.session.user },
            { $pull: { items: { product_Id: item.product_Id } } }
          );
        })
          return res.status(200).json({ message: 'Order placed successfully',cod:true });
        }
        if(paymentMethod=="RAZORPAY"){
           const razorpayOrder=await razorpay.orders.create({
            amount:Number(order.totalAmount*100),
            receipt:order._id.toString(),
            currency:"INR",
           })
           return res.status(200).json({
            message:"razorpay order created successfully",
            amount:razorpayOrder.amount,
            currency:razorpayOrder.currency,
            razorpayOrderId: razorpayOrder.id, 
            razor:true,
            key:process.env.RAZORPAY_KEY_ID
           })

        }
       
      } catch (error) {
        console.error('Error during order placement:', error);
        return res.status(500).json({ message: 'Server error' });
      }
   

    


}

exports.cancelOrder = async (req, res) => {
  try {
      const { product_Id } = req.params;
      
const order = await Order.findOne({ "items.product_Id": product_Id });
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

      
      await order.save();

     
      return res.status(200).json({ message: 'Order canceled successfully' });
  } catch (error) {
      console.error('Error canceling order:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};
