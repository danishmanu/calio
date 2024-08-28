const mongoose =require("mongoose");
require("dotenv").config


const connectDB=async()=>{
    try{
        const uri=process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log("Mongo DB connected");
   }
    catch(err){
        console.log("error message",err)

    }
}
module.exports=connectDB