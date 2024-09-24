const Cart=require("../models/Cart")
const Wishlist=require("../models/Whishlist")
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

const wishlistMiddleware = async (req, res, next) => {
    try {
     
        let user = req.session.user;
        res.locals.user = user; 

        if (user) {
         
            let wishlist = await Wishlist.findOne({ user_Id: user});
            res.locals.wishlist = wishlist;
        } else {
            res.locals.wishlist = null;
        }

        next();
    } catch (err) {
        console.error("Error in wishlist middleware:", err);
        next(err);
    }
};
module.exports = { cartMiddleware, wishlistMiddleware };