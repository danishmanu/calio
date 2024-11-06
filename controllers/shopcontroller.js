const User = require("../models/User")
const Address = require("../models/Address");
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brands = require('../models/Brand');
const Cart = require("../models/Cart")

exports.getShop = async (req, res) => {
  try {
    let { brand, category, filter, query, page = 1, limit = 3 } = req.query;
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

    searchQuery.isDelete = false;


    let productData = await Product.find(searchQuery)
      .populate('brand_Id')
      .populate('category_Id');


    if (filter) {
      if (filter === 'price-low-high') {
        productData.sort((a, b) => {
          const priceA = a.offer && a.offer.discountPercentage ? a.price - (a.price * (a.offer.discountPercentage / 100)) : a.price;
          const priceB = b.offer && b.offer.discountPercentage ? b.price - (b.price * (b.offer.discountPercentage / 100)) : b.price;
          return priceA - priceB;
        });
      } else if (filter === 'price-high-low') {
        productData.sort((a, b) => {
          const priceA = a.offer && a.offer.discountPercentage ? a.price - (a.price * (a.offer.discountPercentage / 100)) : a.price;
          const priceB = b.offer && b.offer.discountPercentage ? b.price - (b.price * (b.offer.discountPercentage / 100)) : b.price;
          return priceB - priceA;
        });
      } else if (filter === 'a-z') {
        productData.sort((a, b) => a.name.localeCompare(b.name));
      } else if (filter === 'z-a') {
        productData.sort((a, b) => b.name.localeCompare(a.name));
      } else if (filter === 'new-arrivals') {
        productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }



    const totalProducts = productData.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const paginatedProducts = productData.slice((page - 1) * limit, page * limit);
    const categoryData = await Category.find({ isDelete: false });
    const brandData = await Brands.find({ isDelete: false });    const user = req.session.user;

    res.render('users/shop', { productData: paginatedProducts, filter, brand, category, categoryData, brandData, user, totalPages, currentPage: Number(page) });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};
