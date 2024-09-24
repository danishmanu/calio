const express=require("express");
const router=express.Router();
const userController=require("../controllers/userController");
const cartController=require("../controllers/cartController");
const addressController=require("../controllers/addressController");
const passport = require("passport");
const profileController=require("../controllers/profileController")
const shopController=require("../controllers/shopcontroller")
const checkoutController=require("../controllers/checkoutController")
const wishlistController=require("../controllers/wishlistController")
router.get("/",userController.main)
router.get("/login",userController.getLogin)
router.get("/login/forget_password",userController.forgetPass)

router.post("/login",userController.login)
router.get("/signup",userController.getSignup)
router.get("/otp_verification",userController.getOtp)
router.post("/otp_verification",userController.checkOtp)
router.get("/auth/google",passport.authenticate("google",{scope:['profile','email'],prompt:"select_account"}))
router.get("/auth/google/callback",passport.authenticate("google",{failureRedirect:'/login'}),(req,res)=>{
    
    req.session.user=req.user._id
    res.redirect("/")
})
router.get("/home",userController.Auth,userController.main)
router.get("/shop",shopController.getShop)
router.get("/product/:id",userController.getProduct)
router.post("/signup",userController.signup)

router.post("/logout", userController.logout)

router.get("/cart",cartController.Auth,cartController.getCart)
router.post("/addToCart/:id",cartController.Auth,cartController.addToCart)


router.post("/updateCart/:id",cartController.Auth,cartController.updateCart)
router.get("/deleteCart/:id",cartController.Auth,cartController.deleteCart)
router.get("/profile",cartController.Auth,profileController.getProfile)
router.get("/profile/addAddress",addressController.Auth,addressController.getAddAddress)
router.post("/profile/addAddress",addressController.Auth,addressController.addAddress)
router.post("/profile/editUserDetails",addressController.Auth,profileController.editUserDetails)
router.post("/profile/returnProduct",addressController.Auth,profileController.returnProduct)
router.get("/profile/editAddress/:id",addressController.Auth,addressController.getEditAddress)
router.put("/profile/editAddress",addressController.Auth,addressController.editAddress)
router.delete("/profile/deleteAddress/:id",addressController.Auth,addressController.deletAddress)
router.get("/checkout",addressController.Auth,checkoutController.getCheckout)
router.post("/checkout",addressController.Auth,checkoutController.checkout)
router.post("/checkout/applyCoupon",addressController.Auth,checkoutController.applyCoupon)
router.put("/checkout/removeCoupon/:couponCode",addressController.Auth,checkoutController.removeCoupon)
router.post("/orders/cancel",addressController.Auth,checkoutController.cancelOrder)
router.post("/add-to-wallet",addressController.Auth,checkoutController.addToWallet)
router.post("/updatePaymentStatus",addressController.Auth,checkoutController.updatePaymentStatus)
router.get("/wishlist",cartController.Auth,wishlistController.getWishlist)
router.post("/addToWishlist",addressController.Auth,wishlistController.addToWishlist)
router.delete("/wishlist/remove/:productId",addressController.Auth,wishlistController.removeWishlist)
router.post('/wallet/verify-payment',addressController.Auth,checkoutController.verifyWallet
)
  
module.exports=router