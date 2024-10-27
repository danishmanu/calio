const Product = require('../../models/Product');
const Category = require('../../models/Category');

exports.getOffer=async(req,res)=>{
 try{
    const products=await Product.find({isDelete:false}).populate("category_Id")
    const categories=await Category.find({})
  
    res.render("admin/offer",{products,categories})
 }catch(error){

 }
}


exports.addProductOffer = async (req, res) => {
    try {
   
        const { productId, productDiscountPercentage, ProductOffExpiry } = req.body;

       
        if (!productId || !productDiscountPercentage || !ProductOffExpiry) {
         
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

      
        const discountPercentage = parseFloat(productDiscountPercentage);
        if (isNaN(discountPercentage) || discountPercentage <= 0 || discountPercentage > 100) {
         
            return res.status(400).json({ success: false, message: 'Invalid discount percentage.' });
        }

     
        const expiryDate = new Date(ProductOffExpiry);
        if (expiryDate <= Date.now()) {
         
            return res.status(400).json({ success: false, message: 'Expiry date must be in the future.' });
        }

        
        const product = await Product.findById(productId);
        if (!product) {
         
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        
        product.offer = {
            offerType: 'product',
            discountPercentage: discountPercentage,
            expirAt: expiryDate
        };

      
        await product.save();

        res.status(200).json({ success: true, message: 'Offer added successfully!', product });
    } catch (error) {
        console.error('Error adding product offer:', error);
        res.status(500).json({ success: false, message: 'An error occurred while adding the offer.' });
    }
};


exports.addCategoryOffer = async (req, res) => {
   try {
      console.log(req.body)
      const {categoryId, discountPercentage, expirAt} = req.body
      const offerType = 'category'

      const category = await Category.findOne({_id:categoryId})

      const products = await Product.find({category_Id:categoryId})

      if(!category){
        
         return res.json({success:false,message:'category not found!'})
      }
    
      if(category.isDelete){
      
          return res.json({success:false,message:'sorry, the category is removed by admin!'})
      }
      
      const currTime = Date.now()
      if(new Date(expirAt) <= currTime){
        
          return res.json({success:false,message:'sorry,expiry time should be in the future!'})
      }
   
      
      category.offer = {discountPercentage, expirAt}
     
      category.save()

      products.forEach(async (product) => {
          product.offer = {offerType, discountPercentage, expirAt}
          await product.save()
      });
     
      return res.json({success:true,message:'category offer added successfully'})

  } catch (error) {
      console.error('something went wrong',error)
      return res.status(500).json({message:'something went wrong'})
  }
}
exports.deleteProductOffer = async (req, res) => {
   
    const { productId } = req.params;
   
   
    
    try {
       
        await Product.updateOne({_id:productId}, {
            $unset: { offer: "" },
        });
        res.status(200).json({ success: true });
    } catch (error) {
        
        res.status(500).json({ success: false, message: 'Failed to delete product offer.' });
    }
};
