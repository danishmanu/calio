const User = require("../models/User")
const Otp_collection=require("../models/otp")
const { db } = require("../models/User")
const Product = require('../models/Product');
const sendEmail=require("../services/sendEmail")

const bcrypt=require("bcrypt")

function otp_generation(){
  otp=Math.floor(100000 + Math.random() * 900000);
 
  return otp

}

exports.Auth=(async(req,res,next)=>{
  userData=await User.findOne({_id:req.session.user})
    if(req.session.user && userData.isBlock==false){
       return next()
    }
    else{
        res.redirect("/home")
    }

})
exports.main=(async(req,res)=>{
    let products=await Product.find({isDelete:false})
    console.log(products)
    let user=req.session.user
        res.render("users/home",{products,user})
    
    
})
exports.getLogin=(req,res)=>{
  if(req.session.user){
    res.redirect("/")
  }
  else{
    res.render("users/login")
  }
  
}
exports.login=(async(req,res)=>{
  try{
  console.log(req.body.log)
  console.log(req.body.password)
  let {log,password}=req.body
  
 let user=await User.findOne({$and:[{$or:[{email:log},{username:log}]},{googleId:null}]})

 
if(user){
  const match = await bcrypt.compare(password, user.password);
  if(user.isBlock==true){
    req.flash('error','Sorry user is blocked by Admin!')
    res.redirect("/login")
   }
  else if(match){
    console.log("ok")
  req.session.user=user._id
    res.redirect("/home")
  }
  else{
    req.flash('inc_pass','Incorrect password!')
    res.redirect("/login")
  }
 }
 else{
  console.log("hai")
  req.flash('error','Sorry invalid user!')
  res.redirect("/login")
  
 }
}
 catch (error) {
  console.error("Error during login:", error);
  req.session.error = "An error occurred during login. Please try again.";
  return res.redirect("/login");
}
})

exports.getSignup=(req,res)=>{
  if(req.session.user){
    res.redirect("/")
  }
  else{
    msg=req.session.exist;
    match=req.session.pas_match
    req.session.exist=req.session.pas_match=null
    res.render("users/signup",{msg,match})
  }
    
}
exports.signup=(async(req,res)=>{
   userdata={
        username:req.body.username,
        email:req.body.email,
        password:req.body.password,
        phone:req.body.phone
 } 

    
 let existUser=await User.findOne({$or:{username:userdata.username,email:userdata.email}})
 if(existUser){
    req.session.exist="sorry user already exists"
    res.redirect("/signup")
 }
 
 else{
 
    conform_password=req.body.conform_password
    if(userdata.password !== conform_password){
        res.status(400)
        req.session.pas_match="sorry password not match"
    res.redirect("/signup")
    }
    else{
      const created_at=new Date().getTime()
      const expires_at=created_at+1000*60
      
      console.log(created_at)
      console.log(expires_at)
      const otp=otp_generation();
      console.log(otp)   

      const otpData={
        email:userdata.email,
        otp:otp,
        expiresAt:expires_at
      }
      await Otp_collection.create(otpData)
      
      emailData={
        to:userdata.email,
        subject:"verification OTP for fragraance store",
        text:`your otp is:${otp} is expire after 3 mins`

      }
      await sendEmail(emailData)

      req.session.userdata = userdata;
      res.redirect("/otp_verification")
        // userdata.password=await bcrypt.hash(userdata.password,10)
        // await User.create(userdata)
        // req.session.user=userdata.username
        // res.redirect("/")
    }
  
 }
 

})
exports.getOtp=(req,res)=>{
  inv_otp=req.session.inv_otp
  req.session.inv_otp=null
  email=req.session.userdata.email
    res.render("users/otp_verification",{inv_otp,email})
}
exports.checkOtp=async(req,res)=>{
  const otp = await Otp_collection.findOne({otp:req.body.otp,email:req.session.userdata.email})
  if(otp && new Date().getTime() <= otp.expiresAt){
    req.session.userdata.password=await bcrypt.hash(req.session.userdata.password,10)
        await User.create(req.session.userdata)
        user=await User.findOne({email:req.session.userdata.email})
        req.session.user=user._id
        
   res.redirect('/')
  }
  else{
    req.session.inv_otp="sorry invalid otp"
    res.redirect("/otp_verification")
  }
 
}

exports.getProduct=async(req,res)=>{
  id=req.params.id;
  let product=await Product.findById(id)
  const relatedProducts = await Product.find({ category_Id: product.category_Id,_id: { $ne: product._id } });
  // let relatedProducts=await Product.findOne({category_Id:product.category_Id})
  console.log(relatedProducts)
  user=req.session.user
  res.render("users/product",{product,relatedProducts,user})

}
exports.logout = (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.log(err)
      }
      else {
          res.redirect("/")

      }
  })
}
