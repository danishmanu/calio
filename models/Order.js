const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = mongoose.Schema({
    orderId: {
        type: String,
        unique: true 
    },
    user_Id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    deliveryAddress: {
        name: {
            type: String,
            required: true
        },
        country: {
            type: String
        },
        city: {
            type: String
        },
        state: {
            type: String
        },
        pincode: {
            type: Number
        },
        phone: {
            type: Number
        },
        address_line: {
            type: String
        }
    },
    items: [{
        product_Id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
        },
        image: {
            type: String
        },
        returnStatus: {
            type: String,
            default: null,
        },
        returnReason: {
            type: String
        },
        price: {
            type: Number
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'canceled', 'delivered', 'returned'],
            default: 'pending'
        },
    }],
    paymentMethod: {
        type: String,
        enum: ['COD', 'RAZORPAY',"WALLET"],
        required: true
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
    discount: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    payableAmount: {
        type: String,
        required: true
    },
    totalAmount: {
        type: String,
        required: true
    },
    expectedDelivery: {
        type: Date,
        default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 // Default to 7 days from now
    }
}, { timestamps: true });


orderSchema.pre('save', async function(next) {
    const generateOrderId = () => {
       
        return uuidv4().slice(0, 6).toUpperCase(); 
    };

    let unique = false;
    let newOrderId;

   
    while (!unique) {
        newOrderId = generateOrderId();
        const existingOrder = await this.constructor.findOne({ orderId: newOrderId });
        if (!existingOrder) {
            unique = true;
        }
    }

    this.orderId = newOrderId; 
    next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
