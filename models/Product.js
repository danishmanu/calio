const mongoose =require("mongoose")


const productSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
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
