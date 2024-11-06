const Order = require("../models/Order");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePdf = async (orderId, user, res) => {
    try {
        if (!orderId) {
            return res.status(401).json({ message: "Order ID not provided" });
        }

        let order = await Order.findOne({ user_Id: user, _id: orderId }).populate("user_Id");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const invoiceDir = path.join(__dirname, '../invoices');
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir, { recursive: true });
        }
        
        const doc = new PDFDocument({ margin: 50 });
        const filePath = path.join(invoiceDir, `invoice_${orderId}.pdf`);
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Header
        doc.fontSize(20).text('INVOICE', { align: 'center', color: 'blue' });
        doc.moveDown();
        doc.fontSize(14).text(`Hi ${order.user_Id.username},`);
        doc.text(`This is the receipt for a payment of \u20B9${order.payableAmount} for your Order.`);

        // Payment Date
        doc.moveDown();
        doc.fontSize(12).text(`Payment Date: ${new Date(order.createdAt).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        })}`, { align: 'right' });

        doc.moveDown();

        // Billing Information
        doc.text(`Billed To: ${order.user_Id.username}`, { underline: true });
        doc.text(`Address: ${order.deliveryAddress.address_line}, ${order.deliveryAddress.city}, ${order.deliveryAddress.pincode}, ${order.deliveryAddress.country}`);
        doc.text(`Email: ${order.user_Id.email}`);

        doc.moveDown();
        doc.text('Payment To:', { underline: true });
        doc.text('Calio');
        doc.text('Kakkanchery, Malappuram, 676473, India');
        doc.text('Email: calio@gmail.com');

        doc.moveDown();

        // Order Items
        doc.fontSize(16).text('Order Items', { underline: true });
        order.items.forEach((item) => {
            doc.fontSize(12).text(`${item.productName}`);
            doc.text(`Unit Price: \u20B9${item.price}`);
            doc.text(`Quantity: ${item.quantity}`);
            doc.text(`Total: \u20B9${item.price * item.quantity}`);
            doc.moveDown();
        });

        // Summary
        doc.moveDown();
        doc.fontSize(14).text('Summary', { underline: true });
        doc.fontSize(12).text(`Subtotal: \u20B9${order.payableAmount}`);
        doc.text(`Discount: \u20B9${order.discount}`);
        doc.fontSize(14).fillColor('green').text(`Grand Total: \u20B9${order.totalAmount}`, { align: 'right' });

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
        console.error("Error generating PDF:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = generatePdf;
