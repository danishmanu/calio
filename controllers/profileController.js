const User = require("../models/User")
const Otp_collection=require("../models/otp")
const Address = require("../models/Address")
const Order = require("../models/Order")
const Wallet = require("../models/Wallet")
const generatePdf = require("../services/generateInvoice")

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
        
        console.log("Request Body:", req.body);

        const { product_Id, order_Id, reason } = req.body;

        
        const order = await Order.findById(order_Id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

      
        const product = order.items.find(item => item.product_Id.toString() === product_Id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found in this order' });
        }

       
        product.returnStatus = "requested";
        product.returnReason = reason;

        
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
exports.getOrderDetails=async (req,res) => {
    try {
        let user=req.session.user
        let orderId=req.params.orderId
        console.log(orderId)
        console.log(user)
        let order=await Order.findOne({user_Id:user,_id:orderId}).populate("user_Id")
        console.log("i am here ")
        if(!order){
            console.log("i would not be here");
            return res.redirect("/")
            
            
        }
        console.log("i will be here");
        res.render("users/orderDetail",{user,order})
    } catch (error) {
        
    }
}

exports.downloadInvoice = async (req, res) => {
    try {
        console.log("called generafjfjkdfte order")
        const orderId = req.params.orderId;
        const user = req.session.user;

        await generatePdf(orderId, user, res);

    } catch (error) {
        console.error('Error in downloadInvoice:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};