const User = require("../../models/User");
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Brands = require('../../models/Brand');
const Order = require('../../models/Order');
const Wallet = require('../../models/Wallet');
const bcrypt=require("bcrypt")


exports.adminAuth=((req,res,next)=>{
    if(req.session.admin){
       return next()
    }
    else{
      
        res.redirect("/admin/login")
    }

})
exports.getLogin=(req,res)=>{
if(req.session.admin){
    res.redirect("/admin")
}
else{
    res.render("admin/login")
}

}
exports.login=async(req,res)=>{ 
   try{

 
    let {log,password}=req.body;
    
    let admin = await User.findOne({$and:[{$or: [{ email: log },{ username: log } ]},{ isAdmin: true }]});
console.log(admin)
if(admin){
    console.log(password,admin)
    
    const match = await bcrypt.compare(password, admin.password);
if(!match){
   
    res.redirect("/admin/login")
}
else{
    req.session.admin=true

    res.redirect("/admin")
}
}else{

    req.flash('inv_admin',"Sorry invalid Admin!")
res.redirect("/admin/login")

}
}
catch(err){
    console.log(err)
}
}

exports.main=(req,res)=>{
    res.redirect("/admin/dashboard")
}

exports.getDash=async (req,res)=>{
    let orders=await Order.find().sort({createdAt:-1}).populate("user_Id")
   console.log(orders)
   let products=await Product.find()
   let productsCount=products.length
 let users=await User.find({isBlock:false})
    let usersCount=users.length
    let totalAmount = orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
    res.render("admin/dashboard",{orders,usersCount,totalAmount,productsCount})
}
exports.getusers=async(req,res)=>{
    let users=await User.find({isAdmin:false});
    
    res.render("admin/users",{users})
}

exports.blockUser = async (req, res) => {
    
    try {
        id = req.params.id
        await User.updateOne({ _id: id },{$set:{isBlock:true}})
       
        res.redirect("/admin/users")
    }
    catch (err) {
        console.log(err)
    }

}
exports.unblockUser = async (req, res) => {
    
    try {
        id = req.params.id
        await User.updateOne({ _id: id },{$set:{isBlock:false}})
       
        res.redirect("/admin/users")
    }
    catch (err) {
        console.log(err)
    }

}
exports.getProducts=async(req,res)=>{
    try{
        let products=await Product.find({isDelete:false}).populate('category_Id', 'cat_name').populate('brand_Id', 'brand_name')
       console.log(products)
        res.render("admin/products",{products,})
    }
   catch(err){
    console.log(err)
   }
}
exports.getOrders=async(req,res)=>{
    try{

        const orders=await Order.find().sort({createdAt:-1})
        orders.forEach(order => {
            order.formattedDate=new Date(order.createdAt).toLocaleDateString('en-GB',{
                day:'2-digit',
                month:"short",
                year:"numeric"
            })
        });
       
        res.render("admin/orders",{orders})
    }
   catch(err){
    console.log(err)
   }
}
exports.deliverOrder = async (req, res) => {
    try {
        console.log("hekjeiu");
        const { product_Id, user_Id, order_Id } = req.body;
        console.log(req.body)

        const order = await Order.findOne({ user_Id: user_Id, _id: order_Id, "items.product_Id": product_Id });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const item = order.items.find(item => item.product_Id.toString() === product_Id);
        if (!item) {
            return res.status(404).json({ message: 'Product not found in the order' });
        }

        if (item.orderStatus === 'delivered') {
            return res.status(400).json({ message: 'Order is already delivered' });
        }

        if (item.orderStatus === 'canceled') {
            return res.status(400).json({ message: 'Canceled orders cannot be delivered' });
        }

        item.orderStatus = 'delivered';
        order.paymentStatus=true
       
        await order.save();

        return res.status(200).json({ message: 'Order marked as delivered successfully' });
    } catch (error) {
        console.error('Error marking order as delivered:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const { product_Id, user_Id, order_Id } = req.body;

       
        const order = await Order.findOne({ user_Id, _id: order_Id, "items.product_Id": product_Id });
        if (!order) {
            return res.status(404).json({ message: 'Order or product not found' });
        }

        const item = order.items.find(item => item.product_Id.toString() === product_Id);
        if (!item) {
            return res.status(404).json({ message: 'Product not found in the order' });
        }
        if (item.orderStatus === 'delivered') {
            return res.status(400).json({ message: 'Delivered orders cannot be canceled' });
        }

        if (item.orderStatus === 'canceled') {
            return res.status(400).json({ message: 'Order is already canceled' });
        }

        item.orderStatus = 'canceled';
if(item.paymentStatus==true){
            let wallet=await Wallet.findOne({user_Id:order.user_Id})
            if(!wallet){
              const newWallet = new Wallet({
                userId: order.user_Id,
                balance: item.price,  
                history: [{
                    amount: item.price,
                    status: 'credit',
                    description: `Refund for canceled product ${item.productName}`
                }]
            });
            await newWallet.save();
        } else {
          
            wallet.balance += item.price; 
            wallet.history.push({
                amount: item.price-item.price*(item.discount/100),
                status: 'credit',
                description: `Refund for canceled product ${item.productName}`
            });
            await wallet.save();
        }
    }
    
          
        await order.save();

        return res.status(200).json({ message: 'Order canceled successfully' });
    } catch (error) {
        console.error('Error canceling order:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

  


exports.getAddProduct=async(req,res)=>{
    try{
        let category=await Category.find({isDelete:false})
        let brands=await Brands.find({isDelete:false})
        res.render("admin/addProduct",{category,brands})
    }
   catch(err){
    console.log(err)
   }
}

exports.addProduct=async(req,res)=>{
    try{
       const {name,category_Id,brand_Id,description,stock,price}=req.body
       const images = [
        req.files['image1'] ? req.files['image1'][0].filename : null,
        req.files['image2'] ? req.files['image2'][0].filename : null,
        req.files['image3'] ? req.files['image3'][0].filename : null,
        req.files['image4'] ? req.files['image4'][0].filename : null
      ];
      let newProduct=new Product({
        name,
        category_Id,
        brand_Id,
        description,
        price,
        stock,
        images:images.filter(image=> image !==null)
       })
       await newProduct.save()
       res.redirect("/admin/products")
    }
   catch(err){
    res.status(500).json({message:"failed to Add product",error:err.message})
   }
}
exports.addCategory=async(req,res)=>{
    try{
        cat_name=req.body.cat_name
    const exist=await Category.findOne({cat_name})
    if(exist){
        req.flash('error', 'Sorry category already exists!');
        res.redirect("/admin/categories")

    }
    else{
        const category=new Category({
            cat_name
           })
           await category.save()
           req.flash('success', 'New category added successfully!');
           res.redirect("/admin/categories")
    }
      
    }
   catch(err){
    console.log(err)
   }
}
exports.getCategory=async(req,res)=>{
    try{
        let categories=await Category.find({});
        res.render("admin/category",{categories})
    }
   catch(err){
    console.log(err)
   }
}
exports.deleteProduct = async (req, res) => {

    try {
        id = req.params.id
       
        await Product.updateOne({ _id: id },{$set:{isDelete:true}})
       req.flash("success",'product deleted successfully!')
        res.redirect("/admin/products")
    }
    catch (err) {
        console.log(err)
    }

}
exports.deleteCategory = async (req, res) => {

    try {
        id = req.params.id
        await Category.updateOne({ _id: id },{$set:{isDelete:true}})
        await Product.updateMany({ category_Id: id },{$set:{isDelete:true}})
       req.flash("success",'category deleted successfully!')
        res.redirect("/admin/categories")
    }
    catch (err) {
        console.log(err)
    }

}
exports.listCategory=async(req,res)=>{
    id=req.params.id
    await Category.updateOne({ _id: id },{$set:{isDelete:false}})
    req.flash("success",'category listed successfully!')
    res.redirect("/admin/categories")

}
exports.getBrand=async(req,res)=>{
    try{
        let brands=await Brands.find({});
        res.render("admin/brands",{brands})
    }
   catch(err){
    console.log(err)
   }
}
exports.addBrand = async (req, res) => {
    try {
   
      const { brandName, popularBrand } = req.body;
      const brandImage = req.file; 
  
      
      const exist = await Brands.findOne({ brand_name: brandName });
      if (exist) {
       
        return res.status(400).json({
          success: false,
          message: 'Brand name already exists.',
        });
      }
  
      
      const brand = new Brands({
        brand_name: brandName,
        brand_image: brandImage ? brandImage.filename : null, 
        isPopular: popularBrand === 'true', 
      });
  
     
      await brand.save();
  
      
      return res.status(200).json({
        success: true,
        message: 'New brand added successfully!',
        brand,
      });
    } catch (err) {
      console.error(err);
  
      
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  };
  
exports.deleteBrand = async (req, res) => {

    try {
        id = req.params.id
        await Brands.updateOne({ _id: id },{$set:{isDelete:true}})
       
       req.flash("success",'brand unlisted successfully!')
        res.redirect("/admin/brands")
    }
    catch (err) {
        console.log(err)
    }

}
exports.getEditProduct=async (req,res) => {
    id = req.params.id
    let product=await Product.findOne({_id:id}).populate('category_Id', 'cat_name').populate('brand_Id', 'brand_name')
    console.log(product)
    let category=await Category.find({isDelete:false})
    let brands=await Brands.find({isDelete:false})
    res.render("admin/editProduct",{product,category,brands})
    
}
exports.editProduct=async (req,res) => {
    id = req.params.id
    const {name,category_Id,brand_Id,description,stock,price}=req.body
  const product=await Product.findOne({_id:id})
    const images = [
     req.files['image1'] ? req.files['image1'][0].filename : null,
     req.files['image2'] ? req.files['image2'][0].filename : null,
     req.files['image3'] ? req.files['image3'][0].filename : null,
     req.files['image4'] ? req.files['image4'][0].filename : null
    ]
  await Product.updateOne({_id:id},{$set:{
        name,
        category_Id,
        brand_Id,
        description,
        stock,
        price,
        images:images.filter(image=> image !==null)

    }})
   res.redirect('/admin/products')
    
}
exports.listBrand=async(req,res)=>{
    id=req.params.id
    await Brands.updateOne({ _id: id },{$set:{isDelete:false}})
    req.flash("success",'brand listed successfully!')
    res.redirect("/admin/brands")

}
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err)
        }
        else {
            res.redirect("/admin/login")
  
        }
    })
  }