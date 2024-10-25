
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
exports.editCoupon=async (req, res) => {
    const { id } = req.params;
    const { coupon_code, discount, minAmount, maxApplicableAmount, startDate, endDate } = req.body;

    try {
        const existingCoupon = await Coupon.findOne({
            coupon_code: { $regex: new RegExp(`^${coupon_code}$`, 'i') },
            _id: { $ne: id }
        });
        if(existingCoupon){
            return res.status(400).json({message:"coupon name already exist"})
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            id,
            { coupon_code, discount, minAmount, maxApplicableAmount, startDate, endDate },
            { new: true, runValidators: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.status(200).json(updatedCoupon);
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
exports.addCoupon=async(req,res)=>{
    try {
        console.log(req.body);
        
        const { coupon_code,discount,startDate,endDate,minAmount,maxApplicableAmount}=req.body
       
       
        const existingCoupon = await Coupon.findOne({
            coupon_code: { $regex: new RegExp(`^${coupon_code}$`, 'i') },
            _id: { $ne: id }
        });
        
        if(existingCoupon){
            return res.status(401).json({ message: 'coupon already exist' });
        }
        const newCoupon = new Coupon({
            coupon_code,
            discount,
            startDate,
            minAmount,
            maxApplicableAmount,
            endDate
        });
await newCoupon.save();
        res.status(200).json({ message: 'Coupon added successfully' });
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ message: 'Failed to add coupon' }); 
    }
}
