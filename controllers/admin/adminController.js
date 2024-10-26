const User = require("../../models/User");
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Brands = require('../../models/Brand');
const Order = require('../../models/Order');
const Wallet = require('../../models/Wallet');
const bcrypt = require("bcrypt")
const moment = require('moment');
const ExcelJS = require('exceljs');
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


exports.adminAuth = ((req, res, next) => {


    if (req.session.admin) {
        console.log(2);

        return next()
    }
    else {

        res.redirect("/admin/login")
    }

})
exports.getLogin = (req, res) => {
    if (req.session.admin) {
        res.redirect("/admin")
    }
    else {
        res.render("admin/login")
    }

}
exports.login = async (req, res) => {
    try {


        let { log, password } = req.body;

        let admin = await User.findOne({ $and: [{ $or: [{ email: log }, { username: log }] }, { isAdmin: true }] });
        console.log(admin)
        if (admin) {
            console.log(password, admin)

            const match = await bcrypt.compare(password, admin.password);
            if (!match) {

                res.redirect("/admin/login")
            }
            else {
                req.session.admin = true

                res.redirect("/admin")
            }
        } else {

            req.flash('inv_admin', "Sorry invalid Admin!")
            res.redirect("/admin/login")

        }
    }
    catch (err) {
        console.log(err)
    }
}
//admin Dashboard
exports.main = (req, res) => {
    res.redirect("/admin/dashboard")
}
exports.getDash = async (req, res) => {

    let startDate = req.query.startDate;
    let endDate = req.query.endDate;

    const sortType = req.query.sort || 'all';
    if (!startDate && !endDate) {

        const dateRange = getDateRange(sortType);
        startDate = dateRange.startDate || '';
        endDate = dateRange.endDate || '';
    }


    let orderQuery = {};

    if (startDate && endDate) {
        orderQuery = {
            createdAt: { $gte: startDate, $lte: endDate }
        };
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let products = await Product.find();
    let productsCount = products.length;

    let users = await User.find({ isBlock: false });
    let usersCount = users.length;

    const allOrders = await Order.find(orderQuery);
    let totalAmount = allOrders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
    let payableAmount = allOrders.reduce((acc, order) => acc + Number(order.payableAmount), 0);
    let totalDiscount = totalAmount - payableAmount;
    const orders = await Order.find(orderQuery)
        .sort({ createdAt: -1 })
        .populate("user_Id")
        .skip(skip)
        .limit(limit);

    const totalOrders = allOrders.length;
    const totalPages = Math.ceil(totalOrders / limit);
    const topSellingProducts = await Order.aggregate([

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
    data = {}
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
        page,
        totalPages,
        totalOrders,
        usersCount,
        totalAmount,
        productsCount,
        sortType,
        totalDiscount,
        data,
        topSellingCategories,
        topSellingBrands,
        topSellingProducts,
        sort: sortType
    });
};
exports.getusers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const users = await User.find({ isAdmin: false }).skip(skip).limit(limit);
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/users", { users, currentPage: page, totalPages });
};
exports.getExcelreport = async (req, res) => {
    try {
        let startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        let endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        console.log(startDate, endDate);

        const sortType = req.query.sort || 'all';

        if (!startDate && !endDate) {

            const dateRange = getDateRange(sortType);
            startDate = dateRange.startDate || '';
            endDate = dateRange.endDate || '';
        }
        let orderQuery = {};
        if (startDate && endDate) {
            orderQuery = {
                createdAt: { $gte: startDate, $lte: endDate }
            }
        }
        let orders = await Order.find(orderQuery)
            .sort({ createdAt: -1 }).populate("user_Id").populate("items.product_Id");

        let totalAmount = orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
        let payableAmount = orders.reduce((acc, order) => acc + Number(order.payableAmount), 0);
        let totalDiscount = totalAmount - payableAmount;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report')
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 20 },
            { header: 'User ID', key: 'userId', width: 20 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'payable Amount', key: 'payableAmount', width: 15 },
            { header: 'Date', key: 'date', width: 20 }
        ]
        orders.forEach(order => {
            worksheet.addRow({
                orderId: order.orderId ? order.orderId : order._id.toString(),
                userId: order.user_Id.username,
                totalAmount: `₹${order.totalAmount}`,
                payableAmount: `₹${order.payableAmount}`,
                date: new Date(order.createdAt).toLocaleDateString()
            })
        })
        worksheet.addRow({});
        worksheet.addRow({ orderId: 'Total Sales', totalAmount: `₹${totalAmount.toFixed(2)}` });
        worksheet.addRow({ orderId: 'Payable Amount', totalAmount: `₹${payableAmount.toFixed(2)}` });
        worksheet.addRow({ orderId: 'Total Discount', totalAmount: `₹${totalDiscount.toFixed(2)}` });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating report.");
    }
}
exports.getSalesreport = async (req, res) => {
    try {
        let startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        let endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        console.log(startDate, endDate);

        const sortType = req.query.sort || 'all';

        if (!startDate && !endDate) {

            const dateRange = getDateRange(sortType);
            startDate = dateRange.startDate || '';
            endDate = dateRange.endDate || '';
        }

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
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    width: 90%;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .report-title {
                    text-align: center;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 8px;
                    text-align: center;
                    border: 1px solid #ddd;
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
                                <td>${order.orderId ? order.orderId : order._id}</td>
                                <td>${order.user_Id.username}</td>
                                <td>₹${order.totalAmount}</td>
                                <td>₹${order.payableAmount}</td>
                                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
                <h4>Total Sales: ₹${totalAmount}</h4>
                <h4>Payable Amount: ₹${payableAmount}</h4>
                <h4>Total Discount: ₹${totalDiscount.toFixed(2)}</h4>
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

exports.blockUser = async (req, res) => {

    try {
        id = req.params.id
        await User.updateOne({ _id: id }, { $set: { isBlock: true } })

        res.redirect("/admin/users")
    }
    catch (err) {
        console.log(err)
    }

}
exports.unblockUser = async (req, res) => {

    try {
        id = req.params.id
        await User.updateOne({ _id: id }, { $set: { isBlock: false } })

        res.redirect("/admin/users")
    }
    catch (err) {
        console.log(err)
    }

}
exports.listProduct = async (req, res) => {

    try {
        id = req.params.productId


        let product = await Product.findOne({ _id: id }).populate('category_Id').populate("brand_Id")
        if (product.category_Id.isDelete) {
            req.flash('error', 'Sorry Category is Already  Deleted!');
            return res.redirect("/admin/products")
        }
        if (product.brand_Id.isDelete) {
            req.flash('error', 'Sorry Brand is Already Deleted!');
            return res.redirect("/admin/products")
        }
        await Product.updateOne({ _id: id }, { $set: { isDelete: false } })

        res.redirect("/admin/products")
    }
    catch (err) {
        console.log(err)
    }

}
exports.getProducts = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const totalProducts = await Brands.countDocuments();
        let products = await Product.find().populate('category_Id', 'cat_name').populate('brand_Id', 'brand_name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.render("admin/products", {
            products, totalPages: Math.ceil(totalProducts / limit),
            currentPage: page
        })
    }
    catch (err) {
        console.log(err)
    }
}
exports.getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);


        let orders = await Order.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);


        orders = orders.map(order => ({
            ...order._doc,
            formattedDate: new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
        }));


        res.render('admin/orders', {
            orders,
            currentPage: page,
            totalPages,
        });

    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
};
exports.deliverOrder = async (req, res) => {
    try {
        console.log("heyfool")
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
        order.paymentStatus = true

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
        const itemTotalPrice = item.price * item.quantity;
        const itemProportion = itemTotalPrice / order.totalAmount;
        const discountAmount = (order.discountAmount || 0) * itemProportion;
        const refundAmount = itemTotalPrice - discountAmount;
        if (order.paymentStatus == true) {
            let wallet = await Wallet.findOne({ user_Id: order.user_Id })
            if (!wallet) {
                const newWallet = new Wallet({
                    userId: order.user_Id,
                    balance: refundAmount,
                    history: [{
                        amount: refundAmount,
                        status: 'credit',
                        description: `Refund for canceled product ${item.productName} by Admin`
                    }]
                });
                await newWallet.save();
            } else {

                wallet.balance += refundAmount;
                wallet.history.push({
                    amount: refundAmount,
                    status: 'credit',
                    description: `Refund for canceled product ${item.productName} by Admin`
                });
                await wallet.save();
            }
        }

        await Product.findByIdAndUpdate(
            item.product_Id,
            {
                $inc: { stock: item.quantity }
            },
            { new: true }
        );
        await order.save();

        return res.status(200).json({ message: 'Order canceled successfully' });
    } catch (error) {
        console.error('Error canceling order:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};




exports.getAddProduct = async (req, res) => {
    try {
        let category = await Category.find({ isDelete: false })
        let brands = await Brands.find({ isDelete: false })
        res.render("admin/addProduct", { category, brands })
    }
    catch (err) {
        console.log(err)
    }
}

exports.addProduct = async (req, res) => {
    try {
        const { name, category_Id, brand_Id, description, stock, price } = req.body;

        const existingProduct = await Product.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
        if (existingProduct) {
            req.flash('error', 'Product with this name already exists!');
            return res.redirect('/admin/products/addProduct');
        }

        const images = [
            req.files['image1'] ? req.files['image1'][0].filename : null,
            req.files['image2'] ? req.files['image2'][0].filename : null,
            req.files['image3'] ? req.files['image3'][0].filename : null,
            req.files['image4'] ? req.files['image4'][0].filename : null
        ];

        let newProduct = new Product({
            name,
            category_Id,
            brand_Id,
            description,
            price: parseFloat(price),
            stock,
            images: images.filter(image => image !== null)
        });

        await newProduct.save();
        req.flash('success', 'Product added successfully!');
        res.redirect("/admin/products");
    } catch (err) {
        res.status(500).json({ message: "Failed to add product", error: err.message });
    }
};

exports.addCategory = async (req, res) => {
    try {
        let cat_name = req.body.cat_name

        const exist = await Category.findOne({ cat_name: { $regex: new RegExp(`^${cat_name.trim()}$`, 'i') } });
        if (exist) {
            req.flash('error', 'Sorry category already exists!');
            res.redirect("/admin/categories")

        }
        else {
            const category = new Category({
                cat_name
            })
            await category.save()
            req.flash('success', 'New category added successfully!');
            res.redirect("/admin/categories")
        }

    }
    catch (err) {
        console.log(err)
    }
}
exports.getCategory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

       
        const totalCategories = await Category.countDocuments();

        
        const categories = await Category.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);


        res.render("admin/category", {
            categories,
            totalPages: Math.ceil(totalCategories / limit),
            currentPage: page,

        });
    }
    catch (err) {
        console.log(err)
    }
}
exports.deleteProduct = async (req, res) => {

    try {
        id = req.params.id

        await Product.updateOne({ _id: id }, { $set: { isDelete: true } })
        req.flash("success", 'product deleted successfully!')
        res.redirect("/admin/products")
    }
    catch (err) {
        console.log(err)
    }

}
exports.editCategory = async (req, res) => {
    try {
        console.log("ikdf")
        let { categoryId, categoryName } = req.body
        console.log(categoryId, categoryName)
        const existingCategory = await Category.findOne({ cat_name: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') }, _id: { $ne: categoryId } });

        if (existingCategory) {
            return res.status(400).json({ message: "Category name already exists." });
        }

        await Category.updateOne({ _id: categoryId }, { $set: { cat_name: categoryName } })
        return res.status(200).json({ message: "category name changed successfully" })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: "failed to Change name", err })
    }
}
exports.deleteCategory = async (req, res) => {

    try {
        id = req.params.id
        await Category.updateOne({ _id: id }, { $set: { isDelete: true } })
        await Product.updateMany({ category_Id: id }, { $set: { isDelete: true } })
        req.flash("success", 'category deleted successfully!')
        res.redirect("/admin/categories")
    }
    catch (err) {
        console.log(err)
    }

}
exports.listCategory = async (req, res) => {
    id = req.params.id
    await Category.updateOne({ _id: id }, { $set: { isDelete: false } })
    await Product.updateMany({ category_Id: id }, { $set: { isDelete: false } })
    req.flash("success", 'category listed successfully!')
    res.redirect("/admin/categories")

}
//Brand controller startes
exports.getBrand = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const totalBrands = await Brands.countDocuments();
        let brands = await Brands.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.render("admin/brands", {
            brands,
            totalPages: Math.ceil(totalBrands / limit),
            currentPage: page
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
};

exports.addBrand = async (req, res) => {
    try {
        const { brandName, popularBrand } = req.body;
        const brandImage = req.file;

        const exist = await Brands.findOne({ brand_name: { $regex: new RegExp(`^${brandName.trim()}$`, 'i') } });
        if (exist) {
            req.flash('error', 'Brand name already exists.');
            return res.redirect('/admin/brands');
        }

        const brand = new Brands({
            brand_name: brandName,
            brandImage: brandImage ? brandImage.filename : null,
            isPopular: popularBrand ? true : false,
        });

        await brand.save();
        req.flash('success', 'New Brand added successfully!');
        res.redirect('/admin/brands');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Server error. Please try again later.');
        res.redirect('/admin/brands');
    }
};


exports.deleteBrand = async (req, res) => {

    try {
        id = req.params.id
        await Brands.updateOne({ _id: id }, { $set: { isDelete: true } })

        await Product.updateMany({ brand_Id: id }, { $set: { isDelete: true } })

        req.flash("success", 'brand unlisted successfully!')
        res.redirect("/admin/brands")
    }
    catch (err) {
        console.log(err)
    }

}
//product controller startes
exports.getEditProduct = async (req, res) => {
    id = req.params.id
    let product = await Product.findOne({ _id: id }).populate('category_Id', 'cat_name').populate('brand_Id', 'brand_name')
    console.log(product)
    let category = await Category.find({ isDelete: false })
    let brands = await Brands.find({ isDelete: false })
    res.render("admin/editProduct", { product, category, brands })

}
exports.editProduct = async (req, res) => {
    const id = req.params.id;
    const { name, category_Id, brand_Id, description, stock, price } = req.body;


    const existingProduct = await Product.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
    });

    if (existingProduct) {
        req.flash('error', 'Product with this name already exists!');
        return res.redirect(`/admin/products/edit/${id}`);
    }

    const product = await Product.findOne({ _id: id });
    if (!product) {
        req.flash('error', 'Product not found!');
        return res.redirect('/admin/products');
    }

    const images = [
        req.files['image1'] ? req.files['image1'][0].filename : product.images[0],
        req.files['image2'] ? req.files['image2'][0].filename : product.images[1],
        req.files['image3'] ? req.files['image3'][0].filename : product.images[2],
        req.files['image4'] ? req.files['image4'][0].filename : product.images[3]
    ];

    await Product.updateOne({ _id: id }, {
        $set: {
            name,
            category_Id,
            brand_Id,
            description,
            stock,
            price,
            images: images.filter(image => image !== null)
        }
    });

    res.redirect('/admin/products');
};


exports.editBrand = async (req, res) => {
    try {
        const id = req.params.id;
        const { brandName, popularBrand } = req.body;
        const brandImage = req.file;
        console.log(" iam here editbrand")
        const existingBrand = await Brands.findOne({
            brand_name: { $regex: new RegExp(`^${brandName.trim()}$`, 'i') },
            _id: { $ne: id }
        });

        if (existingBrand) {

            return res.status(200).json({ message: 'Brand name already exists.' });
        }

        const updateData = {
            brand_name: brandName,
            popularBrand: popularBrand === 'on'
        };

        if (brandImage) {
            updateData.brandImage = brandImage.filename;
        }

        await Brands.updateOne({ _id: id }, updateData);
        req.flash('success', 'Brand updated successfully!');
        res.redirect('/admin/brands');

    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while updating the brand.');
        res.redirect('/admin/brands');
    }
}
exports.listBrand = async (req, res) => {
    id = req.params.id
    await Brands.updateOne({ _id: id }, { $set: { isDelete: false } })

    await Product.updateMany({ brand_Id: id }, { $set: { isDelete: false } })

    req.flash("success", 'brand listed successfully!')
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
exports.approveReturn = async (req, res) => {
    try {

        let { order_Id, product_Id, user_Id } = req.body;
        console.log("djfkfdj", order_Id, product_Id,)
        const order = await Order.findOne({ user_Id: user_Id, _id: order_Id });

        if (!order) {
            console.log("no order")
            return res.status(404).json({ message: 'Order or product not found' });

        }

        const item = order.items.find(item => item.product_Id.toString() === product_Id);
        if (!item) {
            console.log("no item")
            return res.status(404).json({ message: 'Product not found in the order' });
        }
        if (item.orderStatus == "returned") {
            console.log("no item")
            return res.status(404).json({ message: 'Product already returned' });
        }


        console.log("hai")

        if (order.paymentStatus === true) {
            let wallet = await Wallet.findOne({ user_Id: order.user_Id });
            const itemTotalPrice = item.price * item.quantity;
            const itemProportion = itemTotalPrice / order.totalAmount;
            const discountAmount = (order.discountAmount || 0) * itemProportion;
            const refundAmount = itemTotalPrice - discountAmount;
            if (!wallet) {

                const newWallet = new Wallet({
                    userId: order.user_Id,
                    balance: refundAmount,
                    history: [{
                        amount: refundAmount,
                        status: 'credit',
                        description: `Refund for return product ${item.productName} in order:${order.orderId ? order.orderId : ""}`
                    }]
                });
                await newWallet.save();
            } else {

                wallet.balance += refundAmount;
                wallet.history.push({
                    amount: refundAmount,
                    status: 'credit',
                    description: `Refund for return product ${item.productName} in order:${order.orderId ? order.orderId : ""}`
                });
                await wallet.save();
            }
        }

        console.log("done")
        item.orderStatus = "returned";
        item.returnStatus = "Approved"
        await order.save();


        return res.status(200).json({ message: 'Return approved and refund processed successfully.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while processing the return.' });
    }
};

exports.rejectReturn = async (req, res) => {
    const { product_Id, order_Id } = req.body;

    try {

        let order = await Order.findById(order_Id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }


        const item = order.items.find(item => item.product_Id.toString() === product_Id);
        if (!item) {
            console.log("no item")
            return res.status(404).json({ message: 'Product not found in the order' });
        }

        item.returnStatus = "rejected"
        await order.save()
        return res.status(200).json({ message: 'Return rejected successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while rejecting the return' });
    }
}

exports.getOrderDetails = async (req, res) => {
    try {

        let orderId = req.params.orderId

        let order = await Order.findOne({ _id: orderId }).populate("user_Id")

        if (!order) {

            return res.redirect("/admin")


        }

        res.render("admin/orderDetail", { order })
    } catch (err) {
        console.error('Error returning product:', err);
        return res.status(500).json({ message: 'Server error while processing return' });
    }
}