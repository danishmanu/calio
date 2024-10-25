const User = require("../models/User")
const Product = require('../models/Product');
const Cart = require('../models/Cart');

exports.Auth=(async(req,res,next)=>{
    userData=await User.findOne({_id:req.session.user})
        if(req.session.user && userData.isBlock==false){
         return next()
      }
      else{
          res.redirect("/login")
      }
  
  })
  exports.getCart = async (req, res) => {
    let user = req.session.user;

    try {
        let cart = await Cart.findOne({ user_Id: user }).populate('items.product_Id');

        if (cart) {
            cart.items = cart.items.map(item => {
                let product = item.product_Id;
                let price = product.price;

             
                if (product.offer && product.offer.discountPercentage && new Date(product.offer.expirAt) > Date.now()) {
                    let discount = (product.price * product.offer.discountPercentage) / 100;
                    price = product.price - discount;
                }

                item.price = price; 
                return item;
            });

            cart.total_price = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        }

        res.render("users/cart", { user, cart });
    } catch (err) {
        console.error("Error fetching cart:", err);
        res.status(500).json({ message: "An error occurred while retrieving the cart" });
    }
};


exports.addToCart = async (req, res) => {
    try {

      let quantity = parseInt(req.body.quantity);
      const user_Id = req.session.user;
      
      if (!user_Id) {
        console.log("i am here")
        return res.status(401).json({ success: false, user: false, message: 'User not logged in' });
      }
      if(quantity<=0){
        return res.status(400).json({ success: false,  message: 'Quantity must be greater than 0' });
      }
      const product_Id = req.params.id;
      const product = await Product.findOne({_id:product_Id,isDelete:false});
  
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
  
      let price = product.price;
  
      if (product.offer && product.offer.discountPercentage && product.offer.expirAt && new Date(product.offer.expirAt) > Date.now()) {
        const discount = (product.price * product.offer.discountPercentage) / 100;
        price = product.price - discount;
      }
  
      let cart = await Cart.findOne({ user_Id });
  
      if (cart) {
        const itemIndex = cart.items.findIndex(item => item.product_Id.toString() === product_Id.toString());
  
        if (itemIndex > -1) {
        
          if (quantity + cart.items[itemIndex].quantity > 10 || quantity + cart.items[itemIndex].quantity > product.stock) {
            return res.status(409).json({ success: false, message: 'Maximum products reached' });
          }
  
       
          cart.items[itemIndex].quantity += quantity;
          cart.items[itemIndex].price = price;
        } else {
        
          if (quantity > 10 ) {
            return res.status(409).json({ success: false, message: 'Maximum products reached' });
          }
          if (quantity > product.stock) {
            return res.status(409).json({ success: false, message: 'Out of Stock' });
          }
         
  
          
          cart.items.push({
            product_Id,
            quantity,
            price: price
          });
        }
  
        
        cart.total_price = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        await cart.save();
  
     } else {
      
        if (quantity > 10 || quantity > product.stock) {
          return res.status(400).json({ success: false, message: 'Maximum products reached' });
        }
  
        cart = new Cart({
          user_Id,
          items: [
            {
              product_Id: product._id,
              quantity,
              price: price
            }
          ],
          total_price: quantity * price
        });
  
        await cart.save();
      }
  
      const cartItemCount = cart.items.length;
      res.status(200).json({ success: true, message: 'Item added to cart', cartItemCount });
  
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ message: 'An error occurred' });
    }
  };
  
  exports.updateCart = async (req, res) => {
    
    try {
      const user_Id = req.session.user;
      const product_Id = req.params.id;
      const { quantity } = req.body;
   
  
      let product = await Product.findById(product_Id);
    
      let price = product.price;
  
    
      if (product.offer && product.offer.discountPercentage && product.offer.expirAt && new Date(product.offer.expirAt) > Date.now()) {
        const discount = (product.price * product.offer.discountPercentage) / 100;
        price = product.price - discount;
      }
  
      let cartitem = await Cart.findOne({ user_Id, "items.product_Id": product_Id });
  
      if (cartitem) {
        let item = cartitem.items.find(item => item.product_Id.toString() === product_Id.toString());
        
        if (item) {
          
          const oldTotalPrice = cartitem.items.reduce((acc, item) => acc += item.price * item.quantity, 0);
          item.quantity = quantity;
          item.price = price;
  
          
          const newTotalPrice = cartitem.items.reduce((acc, item) => acc += item.price * item.quantity, 0);
  
         
          let updatedCart = await Cart.updateOne(
            { user_Id, "items.product_Id": product_Id },
            { 
              $set: {
                "items.$.quantity": quantity,
                "items.$.price": price,
                total_price: newTotalPrice 
              }
            }
          );
  
          res.status(200).json({success:true, total: newTotalPrice, message: "Cart updated" });
        } else {
          res.status(404).json({ message: "Product not found in cart" });
        }
      } else {
        res.status(404).json({ message: "Cart not found" });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  };
  
  exports.deleteCart=async(req,res)=>{
    try{
        id=req.params.id;
        user_Id=req.session.user
    await Cart.updateOne({user_Id}, {$pull: { items: { product_Id: id } }})
        let cart=await Cart.findOne({user_Id})
          total=cart.items.reduce((acc,item)=>  acc=item.price * item.quantity,0)
         
          await Cart.updateOne({user_Id}, { $set: { total_price: total }})
            res.status(200).json({message:"item deleted successfully"})
    }
   
   catch(error){
        console.error(error)
    }

  }