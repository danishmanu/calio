const mongoose=require("mongoose");

const addressSchema=mongoose.Schema({

    user_Id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    address:[
        {
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


        }
    ]

})

const Address=mongoose.model("Address",addressSchema)
module.exports=Address