
      const Coupon=require("../../models/Coupon");


exports.getCoupon=async(req,res)=>{
    try{
        const coupons=await Coupon.find({isDelete:false})
        res.render("admin/coupon",{coupons})
    }
   catch(err){
    console.log(err)
   }
}
exports.deleteCoupon=async(req,res)=>{
try {
    console.log("i amdheuir")
   const {couponId}=req.params
   if(!couponId){
    return res.status(404).json({success:false,message:"coupon not found"})
   }
   coupon=await Coupon.updateOne({_id:couponId},{$set:{isDelete:true}})
    res.status(200).json({success:true,message:"coupon deleted"})
} catch (error) {
    console.error('Error adding coupon:', error);
    res.status(500).json({ message: 'Failed to add coupon' }); 
}

}
exports.addCoupon=async(req,res)=>{
    try {
        console.log(req.body);
        
        const { coupon_code,discount,startDate,endDate,minAmount}=req.body
        console.log(req.body)
        existCoupon=await Coupon.findOne({coupon_code})
        console.log( existCoupon);
        
        if(existCoupon){
            return res.status(401).json({ message: 'coupon already exist' });
        }
        const newCoupon = new Coupon({
            coupon_code,
            discount,
            startDate,
            minAmount,
            endDate
        });
await newCoupon.save();
        res.status(200).json({ message: 'Coupon added successfully' });
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ message: 'Failed to add coupon' }); 
    }
}