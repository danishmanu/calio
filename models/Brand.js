const mongoose=require("mongoose");
const brandSchema=mongoose.Schema({
    brand_name:{
        type:String,
        required:true
    }
    ,
    isDelete:{
        type:Boolean,
        default:false
    }
},{timestamps:true})
const Brands=mongoose.model("Brands",brandSchema);
module.exports=Brands