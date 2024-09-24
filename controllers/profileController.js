const User = require("../models/User")
const Otp_collection=require("../models/otp")
const Address = require("../models/Address")
const Order = require("../models/Order")
const Wallet = require("../models/Wallet")

exports.getProfile=async (req,res)=>{
    const user=await User.findOne({_id:req.session.user})
    const addresses=await Address.findOne({user_Id:req.session.user})
    const orders=await Order.find({user_Id:req.session.user}).sort({createdAt:-1})
    let wallet = await Wallet.findOne({ user_Id: req.session.user }).sort({"history.date":-1});
    if (!wallet) {
        wallet = new Wallet({
            user_Id: req.session.user,
        });
        await wallet.save();
    }if (wallet && wallet.history) {
       
        wallet.history.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    

    
    orders.forEach(order => {
        order.formattedDate=new Date(order.createdAt).toLocaleDateString('en-GB',{
            day:'2-digit',
            month:"short",
            year:"numeric"
        })
    });
    res.render("users/profile",{user,addresses,orders,wallet})

}
exports.returnProduct = async (req, res) => {
    try {
        const { product_Id, order_Id, reason } = req.body;

        console.log(req.body,product_Id,order_Id,reason)
        const order = await Order.findById(order_Id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

       
        const product = order.items.find(item => item.product_Id.toString() === product_Id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found in this order' });
        }

        
                                 
        product.returnStatus = "requested";
        product.returnReason=reason
       
        await order.save();

        return res.status(200).json({ message: 'Product return request submitted successfully' });
    } catch (err) {
        console.error('Error returning product:', err);
        return res.status(500).json({ message: 'Server error while processing return' });
    }
};

exports.editUserDetails=async (req,res)=>{
   try {
    const user_Id=req.session.user
        const {username,email,phone}=req.body
        await User.updateOne({_id:user_Id},{
            username,
            email,
            phone
        })
        res.status(200).json({message:"user details edited successfully",name:username})
   } catch (error) {
    console.error(error)
   }
}