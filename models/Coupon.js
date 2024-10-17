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
    ,minAmount:{
        type:Number
    },maxAmount:{
        type:Number
    },
   
    endDate:{
        type:Date,
        required:true
        
    },
    discount:{
        type:Number,
        required:true


    }
    ,users:[{
        user_Id:{type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        isBought:{type:Boolean,
            default:false
        }
        
    }
    ]
    ,isDelete:{
        type:Boolean,
        default:false
    }

    

})
const Coupon=mongoose.model("Coupon",couponSchema)
module.exports=Coupon
