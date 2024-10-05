const User = require("../models/User")
const Address = require("../models/Address");
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brands = require('../models/Brand');
const Cart=require("../models/Cart")

exports.getShop = async (req, res) => {
  try {
    let { brand, category, filter } = req.query;
    let query = {};

   
    if (brand) {
      query.brand_Id = await Brands.findOne({ brand_name: brand }).select('_id');
    }
    if (category) {
      query.category_Id = await Category.findOne({ cat_name: category }).select('_id');
    }

    
    let productData = await Product.find(query)
      .populate('brand_Id')
      .populate('category_Id');

    
    if (filter) {
      switch (filter) {
        case 'price-low-high':{
          if(productData.offer &&productData.offer.discountPercentage){
            productData = productData.sort((a, b) => (a.price-a.price*(a.offer.discountPercentage/100)) - (b.price-b.price*(b.offer.discountPercentage/100)));
          }
          else{
            productData = productData.sort((a, b) => a.price - b.price);
          }
          
          break;
        }
        case 'price-high-low':{
          if(productData.offer &&productData.offer.discountPercentage){
            productData = productData.sort((a, b) => (b.price-b.price*(b.offer.discountPercentage/100)) - (a.price-a.price*(a.offer.discountPercentage/100)));
          }
          else{
            productData = productData.sort((a, b) => b.price - a.price);
          }
          
          break;
        }
        case 'a-z':
          productData = productData.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'z-a':
          productData = productData.sort((a, b) => b.name.localeCompare(a.name));
          break;
        
        case 'new-arrivals':
          productData = productData.sort((a, b) => b.createdAt - a.createdAt); 
          break;
        default:
          break;
      }
    }

    
    let categoryData = await Category.find({ isDelete: false });
    let brandData = await Brands.find({ isDelete: false });

    
    let user = req.session.user;

    
    res.render('users/shop', { productData, categoryData, brandData, user });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
};
