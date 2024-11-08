const express=require("express");
const router=express.Router();
const userController=require("../controllers/userController");
const cartController=require("../controllers/cartController");
const addressController=require("../controllers/addressController");
const passport = require("passport");
const profileController=require("../controllers/profileController")
const aboutController=require("../controllers/aboutController")
const walletController=require("../controllers/walletController")
const shopController=require("../controllers/shopcontroller")
const checkoutController=require("../controllers/checkoutController")
const wishlistController=require("../controllers/wishlistController")

// Login Routes
router.get("/",userController.main)
router.get("/login",userController.getLogin)
router.post("/login",userController.login)
router.get("/signup",userController.getSignup)
router.get("/otp_verification",userController.getOtp)
router.post("/otp_verification",userController.checkOtp)
router.post("/resetOtpVerify",userController.resetOtpVerify)
router.post("/resetPass",userController.resetPass)

router.put("/resetPassWithOld",cartController.Auth,userController.resetPassWithOld)
//Google Auth
router.get("/auth/google",passport.authenticate("google",{scope:['profile','email'],prompt:"select_account"}))
router.get("/auth/google/callback",passport.authenticate("google",{failureRedirect:'/login'}),(req,res)=>{
    
    req.session.user=req.user._id
    res.redirect("/")
})

router.get("/login/forget_password/emailVerication",userController.getEmailVerify)
router.post("/login/forget_password/emailVerication",userController.emailVerify)
router.get("/login/forget_password",userController.forgetPass)
router.post('/resend-otp/:reset',userController.resendOtp)


router.get("/home",userController.Auth,userController.main)
router.get("/shop",shopController.getShop)
router.get("/product/:id",userController.getProduct)
router.post("/signup",userController.signup)

router.post("/logout", userController.logout)

//Cart Routes
router.get("/cart",cartController.Auth,cartController.getCart)
router.post("/addToCart/:id",cartController.addToCart)
router.post("/updateCart/:id",cartController.Auth,cartController.updateCart)
router.get("/deleteCart/:id",cartController.Auth,cartController.deleteCart)

// profile Routes
router.get("/profile",cartController.Auth,profileController.getProfile)
router.get("/profile/orderDetail/:orderId",cartController.Auth,profileController.getOrderDetails)
router.get("/profile/addAddress",addressController.Auth,addressController.getAddAddress)
router.post("/profile/addAddress",addressController.Auth,addressController.addAddress)
router.post("/profile/editUserDetails",addressController.Auth,profileController.editUserDetails)
router.post("/profile/returnProduct",addressController.Auth,profileController.returnProduct)
router.get("/profile/editAddress/:id",addressController.Auth,addressController.getEditAddress)
router.put("/profile/editAddress",addressController.Auth,addressController.editAddress)
router.delete("/profile/deleteAddress/:id",addressController.Auth,addressController.deletAddress)

//checkout Routes
router.get("/checkout",addressController.Auth,checkoutController.getCheckout)
router.post("/checkout",addressController.Auth,checkoutController.checkout)
router.post("/checkout/applyCoupon",addressController.Auth,checkoutController.applyCoupon)
router.put("/checkout/removeCoupon/:couponCode",addressController.Auth,checkoutController.removeCoupon)
router.post("/orders/cancel",addressController.Auth,checkoutController.cancelOrder)
router.post("/updatePaymentStatus",addressController.Auth,checkoutController.updatePaymentStatus)

//Wishlist Routes
router.get("/wishlist",cartController.Auth,wishlistController.getWishlist)
router.post("/addToWishlist",wishlistController.addToWishlist)
router.delete("/wishlist/remove/:productId",addressController.Auth,wishlistController.removeWishlist)

//wallet Routes
router.post("/add-to-wallet",addressController.Auth,walletController.addToWallet)
router.post('/wallet/verify-payment',addressController.Auth,walletController.verifyWallet
)


router.get("/downloadInvoice/:orderId", cartController.Auth, profileController.downloadInvoice);
router.post("/orderDetails/getRepaymentDetails", cartController.Auth, checkoutController.getRepaymentDetails);
router.post("/orderDetails/repayment", cartController.Auth, checkoutController.confirmRepayment);
//about Routes
router.get("/about",aboutController.getAbout)
//contact Routes
router.get("/contact",aboutController.getContact)
module.exports=router