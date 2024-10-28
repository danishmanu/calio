

exports.getAbout=async (req,res)=>{
    try {
      let user=req.session.user
      res.render("users/about",{user});
    } catch (error) {
     

      res.status(500).send('Server Error');
    }
  }

  exports.getContact=async (req,res)=>{
    try {
      let user=req.session.user
      res.render("users/contact",{user});
    } catch (error) {
     
      console.log(error);
      res.status(500).send('Server Error');
    }
  }