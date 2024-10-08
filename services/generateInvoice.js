const Order = require("../models/Order");  
const User = require("../models/User");    
const pdf = require('html-pdf');          
const generatePdf = async (orderId, user, res) => {
    try {
        console.log("called generate order")
        if (!orderId) {
            return res.status(401).json({ message: "Order ID not provided" });
        }

        // Fetch the order and user details
        let order = await Order.findOne({ user_Id: user, _id: orderId }).populate("user_Id");
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        
        
        let htmlContent = `  
         <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <!-- Bootstrap CSS -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href='https://fonts.googleapis.com/css?family=Kaisei Opti' rel='stylesheet'>
        
          
           
            <title>Calio</title>
             <style>
          .receipt-content .logo a:hover {
            text-decoration: none;
            color: #7793C4; 
          }
      
          .receipt-content .invoice-wrapper {
            background: #FFF;
            border: 1px solid #CDD3E2;
            box-shadow: 0px 0px 1px #CCC;
            padding: 40px 40px 60px;
            margin-top: 40px;
            border-radius: 4px; 
          }
      
          .receipt-content .invoice-wrapper .payment-details span {
            color: #A9B0BB;
            display: block; 
          }
          .receipt-content .invoice-wrapper .payment-details a {
            display: inline-block;
            margin-top: 5px; 
          }
      
          .receipt-content .invoice-wrapper .line-items .print a {
            display: inline-block;
            border: 1px solid #9CB5D6;
            padding: 13px 13px;
            border-radius: 5px;
            color: #708DC0;
            font-size: 13px;
            transition: all 0.2s linear; 
          }
      
          .receipt-content .invoice-wrapper .line-items .print a:hover {
            text-decoration: none;
            border-color: #333;
            color: #333; 
          }
      
          .receipt-content {
            background: #ECEEF4; 
          }
      
          @media (min-width: 1200px) {
            .receipt-content .container {
              width: 900px; 
            } 
          }
      
          .receipt-content .logo {
            text-align: center;
            margin-top: 50px; 
          }
      
          .receipt-content .logo a {
            font-family: Myriad Pro, Lato, Helvetica Neue, Arial;
            font-size: 36px;
            letter-spacing: .1px;
            color: #555;
            font-weight: 300;
            transition: all 0.2s linear; 
          }
      
          .receipt-content .invoice-wrapper .intro {
            line-height: 25px;
            color: #444; 
          }
      
          .receipt-content .invoice-wrapper .payment-info {
            margin-top: 25px;
            padding-top: 15px; 
          }
      
          .receipt-content .invoice-wrapper .payment-info span {
            color: #A9B0BB; 
          }
      
          .receipt-content .invoice-wrapper .payment-info strong {
            display: block;
            color: #444;
            margin-top: 3px; 
          }
      
          @media (max-width: 767px) {
            .receipt-content .invoice-wrapper .payment-info .text-right {
              text-align: left;
              margin-top: 20px; 
            } 
          }
      
          .receipt-content .invoice-wrapper .payment-details {
            border-top: 2px solid #EBECEE;
            margin-top: 30px;
            padding-top: 20px;
            line-height: 22px; 
          }
      
          @media (max-width: 767px) {
            .receipt-content .invoice-wrapper .payment-details .text-right {
              text-align: left;
              margin-top: 20px; 
            } 
          }
      
          .receipt-content .invoice-wrapper .line-items {
            margin-top: 40px; 
          }
      
          .receipt-content .invoice-wrapper .line-items .headers {
            color: #A9B0BB;
            font-size: 13px;
            letter-spacing: .3px;
            border-bottom: 2px solid #EBECEE;
            padding-bottom: 4px; 
          }
      
          .receipt-content .invoice-wrapper .line-items .items {
            margin-top: 8px;
            border-bottom: 2px solid #EBECEE;
            padding-bottom: 8px; 
          }
      
          .receipt-content .invoice-wrapper .line-items .items .item {
            padding: 10px 0;
            color: #696969;
            font-size: 15px; 
          }
      
          @media (max-width: 767px) {
            .receipt-content .invoice-wrapper .line-items .items .item {
              font-size: 13px; 
            } 
          }
      
          .receipt-content .invoice-wrapper .line-items .items .item .amount {
            letter-spacing: 0.1px;
            color: #84868A;
            font-size: 16px;
          }
      
          @media (max-width: 767px) {
            .receipt-content .invoice-wrapper .line-items .items .item .amount {
              font-size: 13px; 
            } 
          }
      
          .receipt-content .invoice-wrapper .line-items .total {
            margin-top: 30px; 
          }
      
          .receipt-content .invoice-wrapper .line-items .total .extra-notes {
            float: left;
            width: 40%;
            text-align: left;
            font-size: 13px;
            color: #7A7A7A;
            line-height: 20px; 
          }
      
          @media (max-width: 767px) {
            .receipt-content .invoice-wrapper .line-items .total .extra-notes {
              width: 100%;
              margin-bottom: 30px;
              float: none; 
            } 
          }
      
          .receipt-content .invoice-wrapper .line-items .total .extra-notes strong {
            display: block;
            margin-bottom: 5px;
            color: #454545; 
          }
      
          .receipt-content .invoice-wrapper .line-items .total .field {
            margin-bottom: 7px;
            font-size: 14px;
            color: #555; 
          }
      
          .receipt-content .invoice-wrapper .line-items .total .field.grand-total {
            margin-top: 10px;
            font-size: 16px;
            font-weight: 500; 
          }
      
          .receipt-content .invoice-wrapper .line-items .total .field.grand-total span {
            color: #20A720;
            font-size: 16px; 
          }
      
          .receipt-content .invoice-wrapper .line-items .total .field span {
            display: inline-block;
            margin-left: 20px;
            min-width: 85px;
            color: #84868A;
            font-size: 15px; 
          }
      
          .receipt-content .invoice-wrapper .line-items .print {
            margin-top: 50px;
            text-align: center; 
          }
      
          .receipt-content .invoice-wrapper .line-items .print a i {
            margin-right: 3px;
            font-size: 14px; 
          }
      
          .receipt-content .footer {
            margin-top: 40px;
            margin-bottom: 110px;
            text-align: center;
            font-size: 12px;
            color: #969CAD; 
          }  
        </style>
        </head> 
       
        <body>
        <div class="receipt-content">
          <div class="container bootstrap snippets bootdey">
            <div class="row">
              <div class="col-12">
                <div class="invoice-wrapper">
                  <div class="intro">
                    <h1 class="text-center fw-bolder">INVOICE</h1>
                    Hi <strong>${order.user_Id.username}</strong>, 
                    <br>
                    This is the receipt for a payment of <strong>₹ ${order.payableAmount}</strong> for your Order.
                  </div>
      
                  <div class="payment-info">
                    <div class="row">
                      <div class="col-6">
                      
                        <strong></strong>
                      </div>
                      <div class="col-6 text-right">
                        <span>Payment Date</span>
                        <strong>${new Date(order.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })}</strong>
                      </div>
                    </div>
                  </div>
      
                  <div class="payment-details">
                    <div class="row">
                      <div class="col-6">
                        <span>Billed To</span>
                        <strong>${order.user_Id.username}</strong>
                        <p>
                          ${order.deliveryAddress.address_line} <br>
                          ${order.deliveryAddress.city} <br>
                          ${order.deliveryAddress.pincode} <br>
                          ${order.deliveryAddress.country} <br>
                          <a href="mailto:${order.user_Id.email}">${order.user_Id.email}</a>
                        </p>
                      </div>
                      <div class="col-6 text-right">
                        <span>Payment To</span>
                        <strong>Calio</strong>
                        <p>
                          kakkanchery <br>
                          Malappuram <br>
                          676473 <br>
                          India <br>
                          <a href="mailto:calio@gmail.com">calio@gmail.com</a>
                        </p>
                      </div>
                    </div>
                  </div>
      
                  <div class="line-items">
                    <div class="headers clearfix">
                      <div class="row">
                        <div class="col-5">Description</div>
                        <div class="col-3 text-right">Unit Price</div>
                        <div class="col-4 text-right">Total</div>
                      </div>
                    </div>
      
                    ${order.items.map((item) => `
                      <div class="items">
                        <div class="item clearfix">
                          <div class="row">
                            <div class="col-5">${item.productName}</div>
                            <div class="col-3 text-right">₹ ${item.price}</div>
                            <div class="col-4 text-right">₹ ${item.price * item.quantity}</div>
                          </div>
                        </div>
                      </div>
                    `).join("")}
      
                    <div class="total">
                      <div class="row">
                        <div class="extra-notes">
                          <strong>Extra Notes</strong>
                          <p>Your payment has been received.</p>
                        </div>
                        <div class="field">
                          <strong>Subtotal</strong>
                          <span>₹ ${order.payableAmount}</span>
                        </div>
                        <div class="field">
                          <strong>Discount</strong>
                          <span>₹ ${order.discount}</span>
                        </div>
                        <div class="field grand-total">
                          <strong>Grand Total</strong>
                          <span>₹ ${order.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
      
                  <div class="print">
                    <a href="#" onclick="window.print()">
                      <i class="fa fa-print"></i> Print Invoice
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for your order!</p>
          </div>
        </div>
        


<!-- Bootstrap JS (for navbar toggle) -->

<!-- Bootstrap Icons (optional) -->

</body>
</html>

      `;
        pdf.create(htmlContent).toFile(`./invoices/invoice_${orderId}.pdf`, function(err, pdfRes) {
            if (err) {
                console.error('Error creating PDF:', err);
                return res.status(500).json({ message: "Failed to generate PDF" });
            } else {
                console.log('PDF generated:', pdfRes.filename);
              
                return res.download(pdfRes.filename, `Invoice-${orderId}.pdf`, (err) => {
                    if (err) {
                        console.error('Error sending PDF:', err);
                        res.status(500).send("Error sending PDF");
                    }
                });
            }
        });

    } catch (error) {
        console.log('Error generating PDF:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = generatePdf;
