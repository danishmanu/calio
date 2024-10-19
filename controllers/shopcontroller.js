const User = require("../models/User")
const Address = require("../models/Address");
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brands = require('../models/Brand');
const Cart=require("../models/Cart")
exports.getShop = async (req, res) => {
  try {
    let { brand, category, filter, query, page = 1, limit = 2 } = req.query; 
    let searchQuery = {};

   
    if (query) {
      searchQuery.name = { $regex: query, $options: 'i' };
    }

    
    if (brand) {
      const brandDoc = await Brands.findOne({ brand_name: brand }).select('_id');
      if (brandDoc) {
        searchQuery.brand_Id = brandDoc._id;
      }
    }

    
    if (category) {
      const categoryDoc = await Category.findOne({ cat_name: category }).select('_id');
      if (categoryDoc) {
        searchQuery.category_Id = categoryDoc._id;
      }
    }

    // Fetch products based on combined searchQuery
    let productData = await Product.find(searchQuery)
      .populate('brand_Id')
      .populate('category_Id')
      .skip((page - 1) * limit)  
      .limit(Number(limit));      

  
    const totalProducts = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalProducts / limit);

    // Apply sorting if a filter is provided
    if (filter) {
      // Sorting logic remains the same
      // ...
    }

    // Fetch categories and brands for the filters
    const categoryData = await Category.find({ isDelete: false });
    const brandData = await Brands.find({ isDelete: false });

    // Get user session info
    const user = req.session.user;

    
    res.render('users/shop', { productData,filter,brand,category, categoryData, brandData, user, totalPages, currentPage: Number(page) });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};
