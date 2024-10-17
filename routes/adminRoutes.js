const express=require("express");
const router=express.Router();
const upload = require('../middleware/multer');
const adminController=require("../controllers/admin/adminController");
const couponController=require("../controllers/admin/couponController")
const offerController=require("../controllers/admin/offerController")
router.get("/login",adminController.getLogin)
router.post("/login",adminController.login)
router.get("/",adminController.adminAuth,adminController.main)
router.get("/dashboard",adminController.adminAuth,adminController.getDash)
router.get("/users",adminController.adminAuth,adminController.getusers)
// router.delete('/users/delete/:id',adminController.adminAuth, adminController.deleteUser)
router.patch('/users/block/:id',adminController.adminAuth, adminController.blockUser)
router.patch('/users/unblock/:id',adminController.adminAuth, adminController.unblockUser)
router.get("/products",adminController.adminAuth,adminController.getProducts)

router.get("/products/addProduct",adminController.adminAuth,adminController.getAddProduct);
router.get('/products/edit/:id',adminController.adminAuth, adminController.getEditProduct )
router.put('/products/edit/:id',adminController.adminAuth,upload.fields([{name:'image1'},
    {name:'image2'},
    {name:'image3'},
    {name:'image4'}
]), adminController.editProduct )
router.delete('/products/delete/:id',adminController.adminAuth, adminController.deleteProduct )
router.post("/products/addProduct",adminController.adminAuth,upload.fields([{name:'image1'},
    {name:'image2'},
    {name:'image3'},
    {name:'image4'}
]),adminController.addProduct)

router.get("/orders",adminController.adminAuth,adminController.getOrders)
router.post("/orders/cancel",adminController.cancelOrder);
router.post('/orders/deliver', adminController.deliverOrder);
router.post('/orders/approveReturn', adminController.approveReturn);
router.post('/orders/rejectReturn', adminController.rejectReturn);

router.get("/categories",adminController.adminAuth,adminController.getCategory)
router.post("/categories",adminController.adminAuth,adminController.addCategory)
router.delete('/categories/:id',adminController.adminAuth, adminController.deleteCategory)
router.patch('/categories/:id',adminController.adminAuth, adminController.listCategory)

router.get("/brands",adminController.adminAuth,adminController.getBrand)
router.post("/brands",adminController.adminAuth,upload.single('brandImage'),adminController.addBrand)
router.delete('/brands/:id',adminController.adminAuth, adminController.deleteBrand)
router.patch('/brands/:id',adminController.adminAuth, adminController.listBrand)
router.post("/logout",adminController.adminAuth,adminController.logout)


router.get("/coupon",adminController.adminAuth,couponController.getCoupon)
router.post("/coupon",adminController.adminAuth,couponController.addCoupon)
router.delete("/coupon/:couponId",adminController.adminAuth,couponController.deleteCoupon)
router.get("/generate-pdf",adminController.adminAuth,adminController.getSalesreport)
router.get("/getExcelSales",adminController.adminAuth,adminController.getExcelreport)

router.get("/offer",adminController.adminAuth,offerController.getOffer)
router.post("/offer/addProductOffer",adminController.adminAuth,offerController.addProductOffer)
router.post("/offer/addCategoryOffer",adminController.adminAuth,offerController.addCategoryOffer)
router.delete('/offer/deleteProductOffer/:productId',adminController.adminAuth, offerController.deleteProductOffer);
module.exports=router