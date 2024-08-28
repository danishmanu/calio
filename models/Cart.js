const mongoose=require('mongoose')

const cartSchema=mongoose.Schema({
    user_Id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
   
    items:[{
        product_Id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product'
        },
        quantity:{
            type:Number,
            default:1
        }
        ,price:{
            type:Number
        }
    }],
    total_price:{
        type:Number
    }
},{timestamps:true})

const Cart=mongoose.model('Cart',cartSchema);
module.exports=Cart 