const User = require("../models/User")
const Address = require("../models/Address");
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brands = require('../models/Brand');
const Cart=require("../models/Cart")

exports.getShop=async(req,res)=>{
    try{
      
      let productData=await Product.find({})
      let categoryData=await Category.find({isblock:false})
      let brandData=await Brands.find({isblock:false})
     
      user=req.session.user
      let cart=Cart.findOne({user_Id:user})
      res.render("users/shop",{productData,user,categoryData,brandData,cart})
    }catch(error){
      console.log(error)
    }
   
  
  }