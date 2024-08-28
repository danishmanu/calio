const express=require("express");
const router=express.Router();
const upload = require('../middleware/multer');
const adminController=require("../controllers/admin/adminController");
router.get("/login",adminController.getLogin)
router.post("/login",adminController.login)
router.get("/",adminController.adminAuth,adminController.main)
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
router.get("/categories",adminController.adminAuth,adminController.getCategory)
router.post("/categories",adminController.adminAuth,adminController.addCategory)
router.delete('/categories/:id',adminController.adminAuth, adminController.deleteCategory)
router.patch('/categories/:id',adminController.adminAuth, adminController.listCategory)

router.get("/brands",adminController.adminAuth,adminController.getBrand)
router.post("/brands",adminController.adminAuth,adminController.addBrand)
router.delete('/brands/:id',adminController.adminAuth, adminController.deleteBrand)
router.patch('/brands/:id',adminController.adminAuth, adminController.listBrand)
router.post("/logout",adminController.adminAuth,adminController.logout)
module.exports=router