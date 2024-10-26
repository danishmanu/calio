const Order = require("../models/Order");
const PDFDocument = require('pdfkit');
const fs = require('fs');

const generatePdf = async (orderId, user, res) => {
    try {
        if (!orderId) {
            return res.status(401).json({ message: "Order ID not provided" });
        }

        let order = await Order.findOne({ user_Id: user, _id: orderId }).populate("user_Id");
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

     
        const doc = new PDFDocument({ margin: 50 });

       
        const filePath = `./invoices/invoice_${orderId}.pdf`;
        const writeStream = fs.createWriteStream(filePath);
        
      
        doc.pipe(writeStream);

        
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Hi ${order.user_Id.username},`);
        doc.text(`This is the receipt for a payment of ₹${order.payableAmount} for your Order.`);
        
        doc.moveDown();
        
        // Payment Date
        doc.fontSize(12).text(`Payment Date: ${new Date(order.createdAt).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        })}`, { align: 'right' });

        doc.moveDown();

        // Billing and Payment Information
        doc.text(`Billed To: ${order.user_Id.username}`, { underline: true });
        doc.text(`Address: ${order.deliveryAddress.address_line}, ${order.deliveryAddress.city}, ${order.deliveryAddress.pincode}, ${order.deliveryAddress.country}`);
        doc.text(`Email: ${order.user_Id.email}`);

        doc.moveDown();
        doc.text('Payment To:', { underline: true });
        doc.text('Calio');
        doc.text('kakkanchery, Malappuram, 676473, India');
        doc.text('Email: calio@gmail.com');

        doc.moveDown();

        // Line items
        doc.fontSize(16).text('Order Items', { underline: true });
        order.items.forEach((item) => {
            doc.fontSize(12).text(`${item.productName}`);
            doc.text(`Unit Price: ₹${item.price}`);
            doc.text(`Total: ₹${item.price * item.quantity}`);
            doc.moveDown();
        });

        // Summary
        doc.moveDown();
        doc.fontSize(14).text('Summary', { underline: true });
        doc.fontSize(12).text(`Subtotal: ₹${order.payableAmount}`);
        doc.text(`Discount: ₹${order.discount}`);
        doc.fontSize(14).text(`Grand Total: ₹${order.totalAmount}`, { color: 'green' });

        doc.moveDown();
        doc.fontSize(10).text('Thank you for your order!', { align: 'center' });

      
        doc.end();

        
        writeStream.on('finish', () => {
            res.download(filePath, `Invoice-${orderId}.pdf`, (err) => {
                if (err) {
                    
                    res.status(500).send("Error sending PDF");
                }
               
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting PDF:', err);
                });
            });
        });

    } catch (error) {
       
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = generatePdf;
