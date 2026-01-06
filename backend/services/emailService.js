const nodemailer = require("nodemailer");
const logger = require("../config/logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "swarrupak@gmail.com",
    pass: "dgorbwxdyjluxghp",
  },
});


const getEmailTemplate = (subject, content, userInfo) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${subject}</title>
    </head>

    <body style="
      margin:0;
      padding:0;
      background-color:#f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    ">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            
            <!-- Container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="
              max-width: 520px;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              overflow: hidden;
            ">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 32px 24px 16px;">
                  <img
                    src="${process.env.COMPANY_LOGO_URL}"
                    alt="${process.env.COMPANY_NAME}"
                    style="height:48px; margin-bottom: 16px;"
                  />
                  <h1 style="
                    margin: 0;
                    font-size: 20px;
                    color: #111827;
                  ">
                    ${process.env.COMPANY_NAME}
                  </h1>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 0 24px;">
                  <hr style="border:none; border-top:1px solid #e5e7eb;" />
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px;">
                  <h2 style="
                    margin: 0 0 16px;
                    font-size: 18px;
                    color: #111827;
                  ">
                    ${subject}
                  </h2>

                  <p style="
                    margin: 0 0 16px;
                    font-size: 15px;
                    line-height: 1.6;
                    color: #374151;
                  ">
                    ${content}
                  </p>

                  ${
                    userInfo
                      ? `
                  <div style="
                    margin-top: 24px;
                    padding: 16px;
                    background-color: #f9fafb;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #374151;
                  ">
                    <strong>User Details</strong>
                    <ul style="padding-left: 18px; margin: 8px 0 0;">
                      ${Object.entries(userInfo)
                        .map(
                          ([key, value]) =>
                            `<li><strong>${key}:</strong> ${value}</li>`
                        )
                        .join("")}
                    </ul>
                  </div>
                  `
                      : ""
                  }
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="
                  padding: 20px 24px;
                  background-color: #f9fafb;
                  text-align: center;
                  font-size: 13px;
                  color: #6b7280;
                ">
                  <p style="margin:0;">
                    © ${new Date().getFullYear()} ${process.env.COMPANY_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
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


const sendOTP = async (to, otp, userInfo) => {
  const content = `
    Your One-Time Password (OTP) is:
    <br /><br />
    <strong style="font-size:18px;">${otp}</strong>
    <br /><br />
    This OTP is valid for 5 minutes.
  `;
  await sendEmail(to, "Your OTP for Verification", content, userInfo);
};

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

