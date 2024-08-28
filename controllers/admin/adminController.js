const User = require("../../models/User");
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Brands = require('../../models/Brand');
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
    res.render("admin/dashboard")
}
exports.getusers=async(req,res)=>{
    let users=await User.find({isAdmin:false});
    
    res.render("admin/users",{users})
}
// exports.deleteUser = async (req, res) => {

//     try {
//         id = req.params.id
//         await User.deleteOne({ _id: id })
       
//         res.redirect("/admin/users")
//     }
//     catch (err) {
//         console.log(err)
//     }

// }
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
exports.addBrand=async(req,res)=>{
    try{
        brand_name=req.body.brand_name
    const exist=await Brands.findOne({brand_name})
    if(exist){
        req.flash('error', 'Sorry brand already exists!');
        res.redirect("/admin/brands")

    }
    else{
        const brand=new Brands({
            brand_name
           })
           await brand.save()
           req.flash('success', 'New brand added successfully!');
           res.redirect("/admin/brands")
    }
      
    }
   catch(err){
    console.log(err)
   }
}
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