const mongoose=require('mongoose')

const orderSchema=mongoose.Schema({
    user_Id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
   deliveryAddress:{
    name:{
        type:String,
        required:true
    }
    ,country:{
        type:String
    },
    city:{
        type:String
    },
    state:{
        type:String
    },
    pincode:{
        type:Number
    },
    phone:{
        type:Number

    }
    ,address_line:{
        type:String
    }
   },
   
    items:[{
        product_Id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product'
        },
        productName:{
            type:String,
            required: true
 },
        quantity:{
            type:Number,
           
        },
        image:{
            type:String
         }

        ,price:{
            type:Number
        }, orderStatus: {
            type: String,
            enum: ['pending', 'canceled', 'delivered'],
            default: 'pending'
        },
    }],
    paymentMethod: {
        type: String,
        enum: ['COD', 'RAZORPAY'],
        required: true
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
   
    totalAmount:{
        type:String,
        required:true
    },
     expectedDelivery: {
        type: Date,
        default: () => Date.now() + 7 * 24 * 60 * 60 * 1000
     },




},{timestamps:true})

const Order=mongoose.model('Order',orderSchema);
module.exports=Order 