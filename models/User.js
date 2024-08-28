const mongoose=require("mongoose")


const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
        , trim:true
    }, email:{
       type:String,
       required:true,
       trim:true
    },
    googleId:{
        type:String,
        
        default:null 

    },
    phone:{
        type:String,
       required:false,
        default:null,
       maxlength:15
    },
    password: {
        type: String,
        minlength: 6
    },
    isBlock:{
type:Boolean,
default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    }
},{timestamps: true })
const User=mongoose.model("User",userSchema)
module.exports=User