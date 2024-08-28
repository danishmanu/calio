const mongoose=require("mongoose");
const categorySchema=mongoose.Schema({
    cat_name:{
        type:String,
        required:true
    }
    ,
    isDelete:{
        type:Boolean,
        default:false
    }
},{timestamps:true})
const Category=mongoose.model("Category",categorySchema);
module.exports=Category