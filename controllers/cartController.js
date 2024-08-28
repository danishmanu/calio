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
  exports.getCart=async (req,res)=>{
    let user=req.session.user
    let cart=await Cart.findOne({user_Id:user}).populate('items.product_Id')
    console.log(user)
    res.render("users/cart",{user,cart})
  }
  exports.addToCart=async (req,res)=>{
    try{
        console.log("helo guys")
    let quantity=parseInt(req.body.quantity)
   user_Id=req.session.user
    product_Id=req.params.id;
    let product=await Product.findById(product_Id)
        if(!product){
            console.log("product not found")
            res.status(404).json({message:'Product not found'})
        }
        let cart=await Cart.findOne({user_Id})
        console.log("cart finded")
        if(cart){
            console.log(" inside cart")
            const itemIndex=cart.items.findIndex(item=>item.product_Id.toString()===product_Id.toString())
            if(itemIndex>-1){
                console.log(" inside index")
                cart.items[itemIndex].quantity +=quantity
                cart.items[itemIndex].price=cart.items[itemIndex].quantity*product.price
            }
            else{
                console.log("pushed");
                
                cart.items.push({
                    product_Id,
                    quantity,
                    price:quantity*product.price
                })
            }
            cart.total_price=cart.items.reduce((acc,item)=> acc+item.price,0)
            await cart.save()
        }
        else{
            cart=new Cart({
                user_Id,
                items:[
                    {product_Id:product._id,
                        quantity,
                        price:quantity*product.price
                    }
                ],
                total_price:quantity*product.price
        
            });
            console.log(" iam here4")
            await cart.save()
        }
     res.status(200).json({message:"Item added to cart"});
    console.log(" iam here5")
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
        let cart=await Cart.updateOne({user_Id,"items.product_Id": product_Id },{$set:{
            "items.$.quantity": quantity,
            "items.$.price": price
        }})
        if (cart) {
            res.status(200).json({ message: "Item updated" });
            res.redirect('/cart')
        } else {
            res.status(404).json({ message: "Cart or product not found" });
        }
    }
    catch(error){
        res.status(500).json({message:"An error occurred"})
    }
  }