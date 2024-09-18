const Cart=require("../models/Cart")

const cartMiddleware = async (req, res, next) => {
    try {
     
        let user = req.session.user;
        res.locals.user = user; 

        if (user) {
         
            let cart = await Cart.findOne({ user_Id: user});
            res.locals.cart = cart;
        } else {
            res.locals.cart = null;
        }

        next();
    } catch (err) {
        console.error("Error in cart middleware:", err);
        next(err);
    }
};
module.exports=cartMiddleware;