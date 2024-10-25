const express=require("express");
const router=express.Router();
const upload = require('../middleware/multer');
const adminController=require("../controllers/admin/adminController");
const couponController=require("../controllers/admin/couponController")
const offerController=require("../controllers/admin/offerController")
//login routes
router.get("/login",adminController.getLogin)
router.post("/login",adminController.login)
//dashBoard Routes
router.get("/",adminController.adminAuth,adminController.main)
router.get("/dashboard",adminController.adminAuth,adminController.getDash)
router.get("/generate-pdf/",adminController.adminAuth,adminController.getSalesreport)
router.get("/getExcelSales",adminController.adminAuth,adminController.getExcelreport)
router.get("/users",adminController.adminAuth,adminController.getusers)

//users routes

router.patch('/users/block/:id',adminController.adminAuth, adminController.blockUser)
router.patch('/users/unblock/:id',adminController.adminAuth, adminController.unblockUser)
router.get("/products",adminController.adminAuth,adminController.getProducts)

//Products Routes
router.get("/products/addProduct",adminController.adminAuth,adminController.getAddProduct);
router.get('/products/edit/:id',adminController.adminAuth, adminController.getEditProduct )
router.put('/products/edit/:id',adminController.adminAuth,upload.fields([{name:'image1'},
    {name:'image2'},
    {name:'image3'},
    {name:'image4'}
]), adminController.editProduct )
router.patch('/products/list/:productId',adminController.adminAuth, adminController.listProduct)
router.delete('/products/delete/:id',adminController.adminAuth, adminController.deleteProduct )
router.post("/products/addProduct",adminController.adminAuth,upload.fields([{name:'image1'},
    {name:'image2'},
    {name:'image3'},
    {name:'image4'}
]),adminController.addProduct)
    //orders routes
router.get("/orders",adminController.adminAuth,adminController.getOrders)
router.get("/orders/orderDetails/:orderId",adminController.adminAuth,adminController.getOrderDetails)
router.post("/orders/cancel",adminController.cancelOrder);
router.post('/orders/deliver', adminController.deliverOrder);
router.post('/orders/approveReturn', adminController.approveReturn);
router.post('/orders/rejectReturn', adminController.rejectReturn);
     //categories route
router.get("/categories",adminController.adminAuth,adminController.getCategory)
router.post("/categories",adminController.adminAuth,adminController.addCategory)
router.delete('/categories/:id',adminController.adminAuth, adminController.deleteCategory)
//edit category
router.put('/categories',adminController.adminAuth, adminController.editCategory)
//list category
router.patch('/categories/:id',adminController.adminAuth, adminController.listCategory)
//barnds route
router.get("/brands",adminController.adminAuth,adminController.getBrand)
router.post("/brands",adminController.adminAuth,upload.single('brandImage'),adminController.addBrand)
router.delete('/brands/:id',adminController.adminAuth, adminController.deleteBrand)
router.patch('/brands/:id',adminController.adminAuth, adminController.listBrand)
router.put('/brands/:id',adminController.adminAuth,upload.single('brandImage'), adminController.editBrand)

router.post("/logout",adminController.adminAuth,adminController.logout)

//coupon routes
router.get("/coupon",adminController.adminAuth,couponController.getCoupon)
router.post("/coupon",adminController.adminAuth,couponController.addCoupon)
router.patch("/coupon/:id",adminController.adminAuth,couponController.editCoupon)
router.delete("/coupon/:couponId",adminController.adminAuth,couponController.deleteCoupon)


//offer Routes
router.get("/offer",adminController.adminAuth,offerController.getOffer)
router.post("/offer/addProductOffer",adminController.adminAuth,offerController.addProductOffer)
router.post("/offer/addCategoryOffer",adminController.adminAuth,offerController.addCategoryOffer)
router.delete('/offer/deleteProductOffer/:productId',adminController.adminAuth, offerController.deleteProductOffer);
module.exports=router