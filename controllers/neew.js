exports.login=(async(req,res)=>{
    try{
    console.log(req.body.log)
    console.log(req.body.password)
    let {log,password}=req.body
    
   let user=await User.findOne({$and:[{$or:[{email:log},{username:log}]},{googleId:null}]})

   if(!user){
    req.flash('error','Sorry invalid user!')
    res.redirect("/login")
    return 
   }

   if(user.isBlock){
    req.flash('error','Sorry user is blocked by Admin!')
    res.redirect("/login")
    return 
   }


  
   
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
  })``