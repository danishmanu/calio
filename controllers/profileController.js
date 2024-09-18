const User = require("../models/User")
const Otp_collection=require("../models/otp")
const Address = require("../models/Address")
const Order = require("../models/Order")
exports.getProfile=async (req,res)=>{
    const user=await User.findOne({_id:req.session.user})
    const addresses=await Address.findOne({user_Id:req.session.user})
    const orders=await Order.find({user_Id:req.session.user}).sort({createdAt:-1})
    orders.forEach(order => {
        order.formattedDate=new Date(order.createdAt).toLocaleDateString('en-GB',{
            day:'2-digit',
            month:"short",
            year:"numeric"
        })
    });
    res.render("users/profile",{user,addresses,orders})

}
exports.returnProduct=async (req,res)=>{
    try{
        const {product_Id,order_Id,reason}=req.body;
        await Order.updateOne({_id:order_Id},{$set:product_Id})
    }
    catch(err){

    }
}
exports.editUserDetails=async (req,res)=>{
   try {
    const user_Id=req.session.user
        const {username,email,phone}=req.body
        await User.updateOne({_id:user_Id},{
            username,
            email,
            phone
        })
        res.status(200).json({message:"user details edited successfully",name:username})
   } catch (error) {
    console.error(error)
   }
}