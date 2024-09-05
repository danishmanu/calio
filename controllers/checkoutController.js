const User = require("../models/User")
// const Otp_collection=require("../models/otp")
const Address = require("../models/Address");
const Product = require('../models/Product');
const Cart = require('../models/Cart');

exports.getCheckout=async(req,res)=>{
    try{
        const user=req.session.user
        if(user){
         const address=await Address.findOne({user_Id:user})
         res.status(200).json({message:"page get successfully"})
         res.render("users/checkout",user,address)
     
        }
        else{
            
        }
    }
    catch(error){
        console.error(error)
    }
   

    


}