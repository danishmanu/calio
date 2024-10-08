const User = require("../../models/User");
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Brands = require('../../models/Brand');
const Order = require('../../models/Order');
const Wallet = require('../../models/Wallet');
const bcrypt=require("bcrypt")
const moment = require('moment'); 
const htmlPdf = require('html-pdf');
function getDateRange(sortType) {
    let startDate = new Date();
    let endDate = new Date();

    switch (sortType) {
        case "week":
            startDate.setDate(startDate.getDate() - 7);

            break;
        case "month":
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case "year":
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
            case "all":
               
                startDate = new Date(0); 
                break;
        default:
            return null;
    }

   
    return { startDate, endDate };
}

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
exports.getDash = async (req, res) => {
    const sortType = req.query.sort || 'all'; 
   
    const { startDate, endDate } = getDateRange(sortType) || {};

    let orderQuery = {};
  
    if (startDate && endDate) {
        orderQuery = {
            createdAt: { $gte: startDate, $lte: endDate }
        };
    }
    
   
    let orders = await Order.find(orderQuery).sort({ createdAt: -1 }).populate("user_Id");
    

    let products = await Product.find();
    let productsCount = products.length;

    let users = await User.find({ isBlock: false });
    let usersCount = users.length;

    let totalAmount = orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
    let payableAmount = orders.reduce((acc, order) => acc + Number(order.payableAmount), 0);
    let totalDiscount = totalAmount - payableAmount;
    const topSellingProducts = await Order.aggregate([
        { $match: orderQuery },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "products", 
                localField: "items.product_Id",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        { $unwind: "$productDetails" }, 
        { 
            $group: {
                _id: "$items.product_Id", 
                totalQuantity: { $sum: "$items.quantity" },
                totalSales: { $sum: "$items.price" }, 
                productName: { $first: "$productDetails.name" } 
            }
        },
        { $sort: { totalQuantity: -1 } }, 
        { $limit: 5 } 
    ]);
    const topSellingBrands = await Order.aggregate([
        { $match: orderQuery },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "products", 
                localField: "items.product_Id",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        { $unwind: "$productDetails" },
        {
            $lookup: {
                from: "brands", 
                localField: "productDetails.brand_Id", 
                foreignField: "_id",
                as: "brandDetails"
            }
        },
        { $unwind: "$brandDetails" }, 
        {
            $group: {
                _id: "$productDetails.brand_Id", 
                totalQuantity: { $sum: "$items.quantity" }, 
                totalSales: { $sum: "$items.price" }, 
                brandName: { $first: "$brandDetails.brand_name" } 
            }
        },
        { $sort: { totalQuantity: -1 } }, 
        { $limit: 5 } 
    ]);

  
    const topSellingCategories = await Order.aggregate([
        { $match: orderQuery },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "products", 
                localField: "items.product_Id",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        { $unwind: "$productDetails" },
        {
            $lookup: {
                from: "categories", 
                localField: "productDetails.category_Id", 
                foreignField: "_id",
                as: "categoryDetails"
            }
        },
        { $unwind: "$categoryDetails" },
        {
            $group: {
                _id: "$productDetails.category_Id",
                totalQuantity: { $sum: "$items.quantity" },
                totalSales: { $sum: "$items.price" }, 
                categoryName: { $first: "$categoryDetails.cat_name" } 
            }
        },
        { $sort: { totalQuantity: -1 } }, 
        { $limit: 5 } 
    ]);
    
  
    const currentDate = new Date();
    data={}
    switch (sortType) {
      case "year":
        filterStartDate = new Date(currentDate.getFullYear() - 4, 0, 1);
        filterEndDate = new Date(currentDate.getFullYear() + 1, 0, 1);
  
        const yearlyData = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: filterStartDate, $lt: filterEndDate },
            },
          },
          {
            $group: {
              _id: { $year: "$createdAt" },
              totalOrders: { $sum: 1 },
              totalAmount: { $sum: { $toDouble: "$totalAmount" } }
            },
          },
          { $sort: { _id: 1 } },
        ]);
  
        let yearlyAmounts = new Array(5).fill(0);
        let yearLabels = [
          currentDate.getFullYear() - 4,
          currentDate.getFullYear() - 3,
          currentDate.getFullYear() - 2,
          currentDate.getFullYear() - 1,
          currentDate.getFullYear(),
        ];
  
        yearlyData.forEach((d) => {
          const index = yearLabels.indexOf(d._id);
          if (index !== -1) {
            yearlyAmounts[index] = d.totalAmount;
          }
        });
        const yearlyTotalPrice = yearlyData.reduce(
          (acc, curr) => acc + curr.totalAmount,
          0
        );
        console.log(yearlyData)
  
        data = {
          label: "Yearly",
          labels: yearLabels,
          values: yearlyAmounts,
          totalPrice: yearlyTotalPrice,
        };
        break;
  
      case "month":
        filterStartDate = new Date(currentDate.getFullYear(), 0, 1);
        filterEndDate = new Date(currentDate.getFullYear() + 1, 0, 1);
  
        const monthlyData = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: filterStartDate, $lt: filterEndDate },
            },
          },
          {
            $group: {
              _id: { $month: "$createdAt" },
              totalOrders: { $sum: 1 },
              totalAmount: { $sum: { $toDouble: "$totalAmount" } }
            },
          },
          { $sort: { _id: 1 } },
        ]);
  
        let monthlyAmounts = new Array(12).fill(0);
        monthlyData.forEach((d) => {
          monthlyAmounts[d._id - 1] = d.totalAmount;
        });
        const monthlyTotalPrice = monthlyData.reduce(
          (acc, curr) => acc + curr.totalAmount,
          0
        );
        console.log(monthlyData)
  
        data = {
          labels: [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
          ],
          label: "Monthly",
          values: monthlyAmounts,
          totalPrice: monthlyTotalPrice,
        };
        break;
  
      case "week":
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
  
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
  
        const weeklyData = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfWeek, $lte: endOfWeek },
            },
          },
          {
            $group: {
              _id: { $dayOfWeek: "$createdAt" },
              totalOrders: { $sum: 1 },
              totalAmount: { $sum: { $toDouble: "$totalAmount" } }
            },
          },
          { $sort: { _id: 1 } },
        ]);
  
        let weeklyAmounts = new Array(7).fill(0);
        weeklyData.forEach((d) => {
          weeklyAmounts[d._id - 1] = d.totalAmount;
        });
  
        const weeklyTotalPrice = weeklyData.reduce(
          (acc, curr) => acc + curr.totalAmount,
          0
        );
  
        data = {
          labels: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
          label: "Weekly",
          values: weeklyAmounts,
          totalPrice: weeklyTotalPrice,
        };
        break;
  
      default:
        const startOfWeekDe = new Date(currentDate);
        startOfWeekDe.setDate(currentDate.getDate() - currentDate.getDay());
        startOfWeekDe.setHours(0, 0, 0, 0); 
  
        const endOfWeekDe = new Date(startOfWeekDe);
        endOfWeekDe.setDate(startOfWeekDe.getDate() + 6);
        endOfWeekDe.setHours(23, 59, 59, 999);
  
        const weeklyDataDe = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfWeekDe, $lte: endOfWeekDe },
            },
          },
          {
            $group: {
              _id: { $dayOfWeek: "$createdAt" },
              totalOrders: { $sum: 1 },
              totalAmount: { $sum: { $toDouble: "$totalAmount" } }
            },
          },
          { $sort: { _id: 1 } },
        ]);
  
        let weeklyAmountsDe = new Array(7).fill(0);
        weeklyDataDe.forEach((d) => {
          weeklyAmountsDe[d._id - 1] = d.totalAmount;
        });
  
        const weeklyTotalPriceDe = weeklyDataDe.reduce(
          (acc, curr) => acc + curr.totalAmount,
          0
        );
  
        data = {
          labels: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
          label: "Weekly",
          values: weeklyAmountsDe,
          totalPrice: weeklyTotalPriceDe,
        };
        break;
    }
  
console.log(data)
    res.render("admin/dashboard", {
        orders,
        usersCount,
        totalAmount,
        productsCount,
        sortType,
        totalDiscount,
        data,
        topSellingCategories,
        topSellingBrands,
        topSellingProducts,
        sort:sortType
    });
};
exports.getusers=async(req,res)=>{
    let users=await User.find({isAdmin:false});
    
    res.render("admin/users",{users})
}
exports.getSalesreport = async (req, res) => {
    try {
        
        const sortType = req.query.sort || 'all'; 
        console.log(req.query.sort,"djkfdjkjkdf")
        const { startDate, endDate } = getDateRange(sortType) || {};

        let orderQuery = {};

        
        if (startDate && endDate) {
            orderQuery = {
                createdAt: { $gte: startDate, $lte: endDate }
            };
        }

        

       
        let orders = await Order.find(orderQuery)
            .sort({ createdAt: -1 })
            .populate("user_Id")
            .populate("items.product_Id");

       

        let totalAmount = orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
        let payableAmount = orders.reduce((acc, order) => acc + Number(order.payableAmount), 0);
        let totalDiscount = totalAmount - payableAmount;

        let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sales Report</title>
            <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body {
                    display: flex;
                    justify-content: center; /* Center content horizontally */
                    align-items: center; /* Center content vertically */
                    height: 100vh; /* Full height of viewport */
                    margin: 0; /* Remove default margin */
                }
                .container {
                    width: 90%; /* Set a percentage width for responsiveness */
                    max-width: 800px; /* Maximum width to control the size */
                    margin: 0 auto; /* Center container */
                }
                .report-title {
                    text-align: center;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%; /* Full width of the container */
                    border-collapse: collapse; /* Ensures table borders are collapsed */
                }
                th, td {
                    padding: 8px;
                    text-align: center; /* Center align the text in table cells */
                    border: 1px solid #ddd; /* Adds borders to table cells */
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="report-title">Sales Report</h1>
                <h5 class="report-title">Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}</h5>
                
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>User ID</th>
                            <th>Total Amount</th>
                            <th>Payable Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>${order._id}</td>
                                <td>${order.user_Id.username}</td>
                                <td>₹${order.totalAmount}</td>
                                <td>₹${order.payableAmount}</td>
                                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
                
                <h4>Total Sales: ₹${totalAmount}</h4>
                <h4>Payable Amount: ₹${payableAmount}</h4>
                <h4>Total Discount: ₹${totalDiscount}</h4>
            </div>
        </body>
        </html>
    `;

        htmlPdf.create(htmlContent).toBuffer((err, buffer) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
            res.send(buffer);
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating report.");
    }
};


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
exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = 4; 
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();
    let orders = await Order.find()
        .sort({ createdAt: -1 })  
        .skip(skip)  
        .limit(limit); 

    
    orders = orders.map(order => {
        return {
            ...order._doc,  
            formattedDate: new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
        };
    });

   
    res.render('admin/orders', {
        orders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
    });
    
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
                balance: (item.price*item.quantity)-((item.price*item.quantity)*order.discount/100),  
                history: [{
                    amount:(item.price*item.quantity)-((item.price*item.quantity)*order.discount/100),
                    status: 'credit',
                    description: `Refund for canceled product ${item.productName} by Admin`
                }]
            });
            await newWallet.save();
        } else {
          
            wallet.balance += (item.price*item.quantity)-((item.price*item.quantity)*order.discount/100); 
            wallet.history.push({
                amount: (item.price*item.quantity)-((item.price*item.quantity)*order.discount/100),
                status: 'credit',
                description: `Refund for canceled product ${item.productName} by Admin`
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
       console.log(price,typeof(price))
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
        price:parseFloat(price),
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
  console.log(brandName,popularBrand,brandImage)
      
      const exist = await Brands.findOne({ brand_name: brandName });
      if (exist) {
       
        return res.status(400).json({
          success: false,
          message: 'Brand name already exists.',
        });
      }
  
      
      const brand = new Brands({
        brand_name: brandName,
        brandImage: brandImage ? brandImage.filename : null, 
        isPopular: popularBrand === 'true', 
      });
  
     
      await brand.save();
  
      
     res.redirect("/admin/brands")
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