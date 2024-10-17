const User = require("../models/User")
const Otp_collection=require("../models/otp")
const { db } = require("../models/User")
const Product = require('../models/Product');
const sendEmail=require("../services/sendEmail")
const Wallet=require("../models/Wallet")
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
 
  let {log,password}=req.body
  
 let user=await User.findOne({$and:[{$or:[{email:log},{username:log}]},{googleId:null}]})

 
if(user){
  const match = await bcrypt.compare(password, user.password);
  if(user.isBlock==true){
    req.flash('error','Sorry user is blocked by Admin!')
    res.redirect("/login")
   }
  else if(match){
    
  req.session.user=user._id
    res.redirect("/home")
  }
  else{
    req.flash('inc_pass','Incorrect password!')
    res.redirect("/login")
  }
 }
 else{

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
exports.forgetPass=async()=>{
  try{
      res.render("users/forgetPass")
  }catch(error){

  }
}
exports.getSignup=(req,res)=>{
  if(req.session.user){
    res.redirect("/")
  }
  else{
    msg=req.session.exist;
    match=req.session.pas_match
    const {refferalcode}=req.query
    if(refferalcode){
      req.session.refferalCode=refferalcode
    }
    req.session.exist=req.session.pas_match=null
    res.render("users/signup",{msg,match})
  }
    
}
exports.signup=(async(req,res)=>{

   userdata={
        username:req.body.username,
        email:req.body.email,
        password:req.body.password,
        phone:req.body.phone,
        reference:req.session.refferalCode? req.session.refferalCode:""
        
 } 
console.log(userdata.reference)
    
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
exports.getOtp = (req, res) => {
  console.log("Fetching OTP...");
  const reset = req.query.reset
  console.log(typeof(reset))
  const email = req.session.userdata ? req.session.userdata.email : null;

  
  if (!email) {
    return res.redirect('/');
  }

 
  const inv_otp = req.session.inv_otp || null;

  req.session.inv_otp = null;

 
  if (!req.session.user) {
    return res.render("users/otp_verification", { inv_otp, email,reset });
  } else {
    return res.redirect('/');
  }
};

exports.resetOtpVerify=async(req,res)=>{
  try {
    const otp = await Otp_collection.findOne({
      otp: req.body.otp,
      email: req.session.userdata.email
    });
    if (otp && new Date().getTime() <= otp.expiresAt) {
      res.render('users/resetPass')
    } else {
      
      req.session.inv_otp = "Sorry, invalid OTP";
      return res.redirect("/otp_verification");
    }
  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).send("Internal Server Error");
  }
 
}
exports.checkOtp = async (req, res) => {
  try {
    const otp = await Otp_collection.findOne({
      otp: req.body.otp,
      email: req.session.userdata.email
    });

    
    if (otp && new Date().getTime() <= otp.expiresAt) {
     
      req.session.userdata.password = await bcrypt.hash(req.session.userdata.password, 10);
      await User.create(req.session.userdata);

      // Check for the referred user based on referral code
      const reffered_user = await User.findOne({
        refferalCode: req.session.userdata.reference
      });

      if (reffered_user) {
        // Find wallet of the referred user
        let wallet = await Wallet.findOne({ user_Id: reffered_user._id });

        if (wallet) {
         
          wallet.balance += 50;
          wallet.history.push({
            amount: 50,
            status: 'credit',
            description: `Amount for referral of ${req.session.userdata.username}`
          });

          await wallet.save();  
        } else {
          console.log("i am coorectly her")
          const newWallet = new Wallet({
            user_Id: reffered_user._id,
            balance: 50,
            history: [{
              amount: 50,
              status: 'credit',
              description: `Amount for referral of ${req.session.userdata.username}`
            }]
          });

          await newWallet.save();  
        }
      }

     
      const user = await User.findOne({ email: req.session.userdata.email });
      req.session.user = user._id;

    
      return res.redirect('/');
    } else {
      
      req.session.inv_otp = "Sorry, invalid OTP";
      return res.redirect("/otp_verification");
    }
  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getProduct=async(req,res)=>{
  try{

  }catch(error){
    console.log(error)
  }
  id=req.params.id;
  let product=await Product.findById(id)
  if(!product){
    res.render("users/product",{user})
  }
  const relatedProducts = await Product.find({ category_Id: product.category_Id,_id: { $ne: product._id } });
  
  user=req.session.user
  res.render("users/product",{product,relatedProducts,user})

}

exports.resetPass=async (req,res)=>{
  try {
    let {password}=req.body
    
    let email=req.session.userdata.email
    let user= await User.findOne({email,isBlock:false})
    
    if(!user){
      return res.status(404).json({ message: 'User not found' });
    }
   
     user.password=await bcrypt.hash(password,10)
     user.save()
     return res.status(200).json({ message: 'Password Changed successfully' });
    
  
  } catch (err) {
    console.error('Error returning product:', err);
  return res.status(500).json({ message: 'Server error while processing return' });
  }
  }
exports.resetPassWithOld=async (req,res)=>{
try {
  let {oldPass,newPass}=req.body
  
  let userId= req.session.user
  let user= await User.findOne({_id:userId,isBlock:false})
  
  if(!user){
    return res.status(404).json({ message: 'User not found' });
  }
  const oldMatch = await bcrypt.compare(oldPass, user.password);
  if(oldMatch){
    if(oldPass==newPass){
      return res.status(404).json({message:"both password must be different"})
    }
   user.password=await bcrypt.hash(newPass,10)
   user.save()
   return res.status(200).json({ message: 'Password Changed successfully' });
  }
  else{
    return res.status(404).json({ message: 'invalid Old password' });
  }

} catch (err) {
  console.error('Error returning product:', err);
return res.status(500).json({ message: 'Server error while processing return' });
}
}
exports.getEmailVerify=async(req,res)=>{
  try {
    console.log("jfjj")
    res.render("users/verifyEmail")
  } catch (error) {
    console.error('Error returning product:', err);
    return res.status(500).json({ message: 'Server error while processing return' });
  }
}
exports.emailVerify = async (req, res) => {
  try {
    console.log("Verifying email...");
    let email = req.body.email;
    console.log(email);
    
    let user = await User.findOne({ email, isBlock: false });

    if (!user) {
      return res.status(404).json({ message: 'Invalid email' });
    }

    const created_at = new Date().getTime();
    const expires_at = created_at + 1000 * 60;
    
    const otp = otp_generation();
    console.log(otp);

    const otpData = {
      email: email,
      otp: otp,
      expiresAt: expires_at
    };
    
    await Otp_collection.create(otpData);
    
    const emailData = {
      to: email,
      subject: "Password reset OTP for fragrance store",
      text: `Your OTP is: ${otp} and it expires after 1 minute.`
    };

    await sendEmail(emailData);

  
    if (!req.session.userdata) {
      req.session.userdata = {};
    }
    req.session.userdata.email = email;
   
    res.status(200).json({message:"valid email"});

  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ message: 'Server error while processing email verification' });
  }
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


