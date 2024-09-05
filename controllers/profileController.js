const User = require("../models/User")
const Otp_collection=require("../models/otp")
const Address = require("../models/Address")

exports.getProfile=async (req,res)=>{
    const user=await User.findOne({_id:req.session.user})
    const addresses=await Address.findOne({user_Id:req.session.user})
    res.render("users/profile",{user,addresses})

}