const mongoose =require("mongoose")


const productSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    offer:{
        offerType:{type:String},
        discountPercentage:{type:Number},
        expirAt:{type:Date},
        status:{type:Boolean, default:true}
    },
    category_Id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',  
        required: true
        
    },
    brand_Id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brands',  
        required: true
    }
    ,
    stock:{
    type:Number,
    required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    }
    ,
    isDelete:{
        type:Boolean,
        required:true,
        default:false
    },
    images:[
        {type:String}
    ]

    

},{timestamps:true})

const Product=mongoose.model("Product",productSchema)
module.exports=Product
