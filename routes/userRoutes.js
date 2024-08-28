const express=require("express");
const router=express.Router();
const userController=require("../controllers/userController");
const cartController=require("../controllers/cartController");
const passport = require("passport");

router.get("/",userController.main)
router.get("/login",userController.getLogin)
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
router.get("/product/:id",userController.getProduct)
router.post("/signup",userController.signup)
router.post("/logout", userController.logout)

router.get("/cart",cartController.Auth,cartController.getCart)
router.post("/addToCart/:id",cartController.Auth,cartController.addToCart)
router.post("/updateCart/:id",cartController.Auth,cartController.updateCart)
module.exports=router