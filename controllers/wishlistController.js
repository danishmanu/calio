const Wishlist=require("../models/Whishlist")
const User = require("../models/User")
const Product = require('../models/Product');
const Cart = require('../models/Cart');
exports.getWishlist = async (req, res) => {
  
    try {
        let user = req.session.user;
    
       
        const wishlist = await Wishlist.findOne({ user_Id: user }).populate('products');
    
    res.render("users/wishlist",{user,wishlist})
       
    
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
      }
    }

    exports.addToWishlist = async (req, res) => {
    try {
      const { product_Id } = req.body;
    
      const user_Id = req.session.user 
 
      
  if (!user_Id) {
    return res.status(401).json({ success: false, message: "login first" });
  }
      let wishlist = await Wishlist.findOne({ user_Id });
  
      if (!wishlist) {
        wishlist = new Wishlist({ user_Id, products: [] });
      }
  
     
      if (wishlist.products.includes(product_Id)) {
        return res.status(401).json({ success: false,exist:true, message: "Product already in wishlist" });
      }
  
      
      wishlist.products.push(product_Id);
      console.log(wishlist)
      await wishlist.save();
  
      res.status(200).json({ success: true, message: "Product added to wishlist",count:wishlist.products.length });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
  exports.removeWishlist = async (req, res) => {
    try {
      const { productId } = req.params;
      const user = req.session.user;
  
      
      const wishlist = await Wishlist.findOne({ user_Id: user });
      
      if (!wishlist) {
        return res.status(404).json({ error: 'Wishlist not found for this user' });
      }
  
      
      const updatedProducts = wishlist.products.filter(item => item.toString() !== productId);
  
      if (updatedProducts.length === wishlist.products.length) {
       
        return res.status(404).json({ error: 'Product not found in wishlist' });
      }
  
      wishlist.products = updatedProducts; 
      await wishlist.save(); 
  
      return res.status(200).json({ message: 'Product removed from wishlist' });
      
    } catch (error) {
   console.error('Error removing product from wishlist:', error);
      return res.status(500).json({ error: 'An error occurred while removing the product' });
    }
  };

