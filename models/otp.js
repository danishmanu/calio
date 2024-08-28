const mongoose=require("mongoose");
const otpSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    }
    ,otp:{
        type:String,
        required:true
    },

    createdAt:{
        type:Date,
        default:Date.now,
        expires:60

    },
        expiresAt:{
            type:Date,
            required:true
        }
    
})
const Otp_collection=mongoose.model("Otp",otpSchema);
module.exports=Otp_collection
