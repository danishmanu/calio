const mongoose=require("mongoose")
const {v4: uuidv4}=require('uuid')

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
    refferalCode:{
        type:String,
        required: false 
    },
    reference:{
        type:String
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
userSchema.pre('save',function(next){
    if(!this.refferalCode){
        this.refferalCode= this.username.slice(0,3)+uuidv4().slice(0,8)
    }   
    next(); 
})
const User=mongoose.model("User",userSchema)
module.exports=User