const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "swarrupak@gmail.com",
    pass: "ywlb aqul cdnf gcja",
  },
});

const getEmailTemplate = (subject, content, userInfo) => {
  return `
    <html>
        <body>
            <img src="${process.env.COMPANY_LOGO_URL}" alt="${
    process.env.COMPANY_NAME
  } Logo" style="width:200px;">
            <h1>${process.env.COMPANY_NAME}</h1>
            <h2>${subject}</h2>
            <p>${content}</p>
            <p>User Info:</p>
            <ul>
                ${Object.entries(userInfo)
                .map(([key, value]) => `<li>${key}: ${value}</li>`)
                .join("")}
            </ul>
            <p>Thank you,<br>${process.env.COMPANY_NAME} Team</p>
        </body>
    </html>
`;
};

const sendEmail = async (to , subject , content , userInfo)=>{
    const html = getEmailTemplate(subject,content, userInfo);

    try{
        await transporter.sendMail({
            from:process.env.EMAIL_USER,
            to,
            subject:`${process.env.COMPANY_NAME} - ${subject}`,
            html
        });
        logger.info(`Email sent to ${to} with subject: ${subject}`);
    }catch(err){
        logger.error(`Failed to send email to ${to}: ${err.message}`);
        throw new Error('Email sending failed');
    }
} 


const sendOTP = async(to,otp,userInfo)=>{
    const content = `Your One-Time Password (OTP) is: <strong>${otp}</strong>. It is valid for 5 minutes.`;
    await sendEmail(to,"Your OTP for Verification",content,userInfo);
}

const sendWelcomeEmail = async(to,userInfo)=>{
    const content = `Welcome to ${process.env.COMPANY_NAME}, ${userInfo.name}! We're excited to have you on board.`;
    await sendEmail(to,"Welcome to Our Service",content,userInfo);
}

const sendOrderConfirmation = async(to,bookingDetails,userInfo)=>{
    const content = `Your booking is confirmed. Details: Seats -${bookingDetails.seats}, Concert -${bookingDetails.concertName}.`;
    await sendEmail(to,'Booking Confirmation',content,userInfo);
};

module.exports={
    sendOTP,
    sendWelcomeEmail,
    sendOrderConfirmation
};