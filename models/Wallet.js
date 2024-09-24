const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    user_Id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    balance:{
        type:Number,
        default:0
    },
    history:[{
        amount:{type:Number, required:true},
        status:{type:String, required:true, enum: ['credit', 'debit']},
        description:{type:String},
        date:{type:Date,
            default: Date.now
        }
    }]
})
const Wallet=mongoose.model('Wallet',walletSchema)
module.exports=Wallet
