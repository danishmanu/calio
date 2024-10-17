const User = require("../models/User")
const Address = require("../models/Address");
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brands = require('../models/Brand');
const Cart=require("../models/Cart")
exports.getShop = async (req, res) => {
  try {
    // Extract brand, category, filter, and query from query parameters
    let { brand, category, filter, query } = req.query;
    let searchQuery = {};

    // If there's a search query, add a regex filter for the product name
    if (query) {
      searchQuery.name = { $regex: query, $options: 'i' }; // 'i' for case-insensitive
    }

    // Filter by brand if provided
    if (brand) {
      const brandDoc = await Brands.findOne({ brand_name: brand }).select('_id');
      if (brandDoc) {
        searchQuery.brand_Id = brandDoc._id;
      }
    }

    // Filter by category if provided
    if (category) {
      const categoryDoc = await Category.findOne({ cat_name: category }).select('_id');
      if (categoryDoc) {
        searchQuery.category_Id = categoryDoc._id;
      }
    }

    // Fetch products based on combined searchQuery
    let productData = await Product.find(searchQuery)
      .populate('brand_Id')
      .populate('category_Id');

    // Apply sorting if a filter is provided
    if (filter) {
      switch (filter) {
        case 'price-low-high': {
          productData = productData.sort((a, b) => {
            const priceA = a.offer && a.offer.discountPercentage
              ? a.price - a.price * (a.offer.discountPercentage / 100)
              : a.price;
            const priceB = b.offer && b.offer.discountPercentage
              ? b.price - b.price * (b.offer.discountPercentage / 100)
              : b.price;
            return priceA - priceB;
          });
          break;
        }
        case 'price-high-low': {
          productData = productData.sort((a, b) => {
            const priceA = a.offer && a.offer.discountPercentage
              ? a.price - a.price * (a.offer.discountPercentage / 100)
              : a.price;
            const priceB = b.offer && b.offer.discountPercentage
              ? b.price - b.price * (b.offer.discountPercentage / 100)
              : b.price;
            return priceB - priceA;
          });
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

    // Fetch categories and brands for the filters
    const categoryData = await Category.find({ isDelete: false });
    const brandData = await Brands.find({ isDelete: false });

    // Get user session info
    const user = req.session.user;

    // Render the shop page with the filtered and sorted data
    res.render('users/shop', { productData, categoryData, brandData, user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};
