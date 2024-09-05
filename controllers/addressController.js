const User = require("../models/User")
const Otp_collection=require("../models/otp")
const Address = require("../models/Address")
exports.Auth=(async(req,res,next)=>{
    userData=await User.findOne({_id:req.session.user})
        if(req.session.user && userData.isBlock==false){
         return next()
      }
      else{
          res.redirect("/login")
      }
  
  })
  exports.getAddAddress=async (req,res)=> {
   
    res.render("users/addAddress",{user:req.session.user,address:null})
   
    
  }
  exports.addAddress=async (req,res)=> {
   try{
    const {name,country,state ,city,pincode,phone,address_line}=req.body
    console.log(name,country,state ,city,pincode,phone,address_line)
     const user_Id=req.session.user
     const existAddress=await Address.findOne({
         user_Id
     })
     if(existAddress){
             await Address.updateOne({user_Id},{$push:{address:{
                 name,
             country,
             state ,
             city,
             pincode,
             phone,
             address_line
             }}})
 
     }else{
         address={
             user_Id,
           address:{
             name,
             country,
             state ,
             city,
             pincode,
             phone,
             address_line
           }
         }
         await Address.create(address)
     }
    res.status(200).json({success:true,message:"new address addded"})
    
   }
   catch(error){
    console.log(error)
   }
  
    
  }
  exports.editAddress=async (req,res)=>{
    try{
      console.log("hello")
      const user_Id=req.session.user
      const {name,phone,country,city,state,pincode,address_line,address_Id}=req.body
      let address=await Address.findOne({user_Id,"address._id": address_Id })
      if(address){
        console.log("i am here")
        await Address.updateOne({user_Id,"address._id": address_Id },{$set:{
          "address.$.name": name,
          "address.$.phone": phone,
          "address.$.country": country,
          "address.$.city": city,
          "address.$.state": state,
          "address.$.pincode": pincode,
          "address.$.address_line": address_line
      }})
      res.status(200).json({ success: true, message: 'Address updated successfully'});
      }else {
        res.status(404).json({ success: false, message: 'Address not found' });
      }
      
  
    }
    catch(error){
      console.log(error)
    }
   
  }

  exports.getEditAddress=async (req,res)=>{
    try{
      console.log("helo o")
      const id=req.params.id;
      user=req.session.user;
      console.log(id)
       let address=await Address.findOne({user_Id:user})
       if(!address){
        return res.status(404).json({ message: "Address not found for this user" });
       }
       curaddress =address.address.find((element)=>element._id.toString()===id)
       console.log(curaddress)
       if (!curaddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      res.render("users/addAddress",{user,address:curaddress})

       
     
    }
    catch(error){
      console.error(error);
      return res.status(500).json({message:"internal server error",error:error.message})
    }
  }
  exports.deletAddress=async (req,res)=>{
    try{
      const user_Id=req.session.user
      const address_Id=req.params.id

      if(user_Id && address_Id){
        await Address.updateOne({user_Id},{$pull:{address:{_id:address_Id}}})
        return res.status(200).json({message:"address is deleted successfully"})
      }
      else{
        return res.status(404).json({ message: "user or address not found" });
      }

    }
    catch(error){
      console.error(error);
      res.status(500).json({message:"internal server error",error:error.message})
    }
  }