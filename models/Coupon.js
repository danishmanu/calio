const mongoose=require("mongoose");

const couponSchema=new mongoose.Schema({
    coupon_code:{
        type:String,
        required:true
    },
    startDate:{
        type:Date,
        required:true
        
    }
    ,
    endDate:{
        type:Date,
        required:true
        
    },
    discount:{
        type:Number,
        required:true


    }
    ,users:[{
        type:String,
        
    }
    ]
    ,isDelete:{
        type:Boolean,
        default:false
    }

    

})
const Coupon=mongoose.model("Coupon",couponSchema)
module.exports=Coupon
