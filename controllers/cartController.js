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
     
    try{
       
    let quantity=parseInt(req.body.quantity)
   user_Id=req.session.user
  console.log("here1")
    product_Id=req.params.id;
    let product=await Product.findById(product_Id)
        if(!product){
            console.log("here2")
            res.status(404).json({message:'Product not found'})
        }
        let price=0;
        console.log("here3")
        if (product.offer && product.offer.discountPercentage && new Date(product.offer.expirAt) > Date.now()) {
            console.log("here4")
            let discount = (product.price * product.offer.discountPercentage) / 100;
            price = product.price - discount;
        } else {
            console.log("here5")
            price = product.price;
        }
        console.log("here6")
        let cart=await Cart.findOne({user_Id})
      
        if(cart){
            console.log("here7")
            const itemIndex=cart.items.findIndex(item=>item.product_Id.toString()===product_Id.toString())
            if(itemIndex>-1){
                console.log("here8")
                cart.items[itemIndex].quantity +=quantity
                cart.items[itemIndex].price=price
            }
            else{
                console.log("here9")
                
                cart.items.push({
                    product_Id,
                    quantity,
                    price:price
                })
            }
            console.log("here10")
            cart.total_price=cart.items.reduce((acc,item)=> acc+item.price*item.quantity,0)
            await cart.save()
        }
        else{
            console.log("here11")
            cart=new Cart({
                user_Id,
                items:[
                    {product_Id:product._id,
                        quantity,
                        price:price
                    }
                ],
                total_price:quantity*price
        
            });
            console.log("here12")
            await cart.save()
        }
        cartItemCount=cart.items.length
     res.status(200).json({message:"Item added to cart",cartItemCount});
   
}
catch(err){
    res.status(500).json({message:"An error occurred"})
}
 
  };
  exports.updateCart=async(req,res)=>{
    try{
        user_Id=req.session.user
        product_Id=req.params.id
        let {price,quantity}=req.body
       
       
        let cartitem=await Cart.findOne({user_Id,"items.product_Id": product_Id })
        if(cartitem){
            let item=cartitem.items.find(item=>item.product_Id.toString()===product_Id.toString());
           
            dif=price-item.price
            total=cartitem.total_price+dif
            let cart=await Cart.updateOne({user_Id,"items.product_Id": product_Id },{$set:{
                "items.$.quantity": quantity,
                "items.$.price": price,
                total_price:total
            }})
            if (cart) {
                res.status(200).json({total});
             
            } else {
                res.status(404).json({ message: "Cart or product not found" });
            }
        }
       
    }
    catch(error){
        res.status(500).json({message:"An error occurred"})
    }
  }
  exports.deleteCart=async(req,res)=>{
    try{
        id=req.params.id;
        user_Id=req.session.user
    await Cart.updateOne({user_Id}, {$pull: { items: { product_Id: id } }})
        let cart=await Cart.findOne({user_Id})
          total=cart.items.reduce((total,item)=> total=total+item.price,0)
         
          await Cart.updateOne({user_Id}, { $set: { total_price: total }})
            res.status(200).json({message:"item deleted successfully"})
    }
   
   catch(error){
        console.error(error)
    }

  }