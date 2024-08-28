require('dotenv').config();

const nodemailer=require("nodemailer")
const transporter= nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
})
const sendEmail=async(emailData)=>{
    try{
        let mailOptions={
            from:process.env.EMAIL_USER,
            to:emailData.to,
            subject:emailData.subject,
            text:emailData.text,

        }
        transporter.sendMail(mailOptions)
    }
        catch(err){
            console.log('Error sending email:', error);
        }
    }
    module.exports = sendEmail ;