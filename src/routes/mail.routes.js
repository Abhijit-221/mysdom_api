const express = require("express");
const nodemailer = require("nodemailer");
const { ResponseCodes } = require("../utils/constant");
const router = express.Router();
// ── Middleware ──────────────────────────────────────────────

// ── Nodemailer Transporter (Gmail) ──────────────────────────
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,   // your Gmail address
        pass: process.env.GMAIL_PASS,   // your Gmail App Password
    },
});

// ── POST /api/contact ───────────────────────────────────────
router.post("/send", async (req, res) => {
    console.log("Received contact form submission:", req.body);
    const { fullName, email, subject, message } = req.body;

    // Basic validation
    if (!fullName || !email || !subject || !message) {
        return res.status(400).json({ success: false, error: "All fields are required." });
    }

    const mailOptions = {
        from: `"${fullName}" <${email}>`,  // sender (must be your Gmail)
        // replyTo: email,                                       // visitor's email for easy reply
        to: process.env.GMAIL_USER,                     // company email
        subject: `[Contact Form] ${subject}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background: #1a1a2e; padding: 24px 32px;">
                    <h2 style="color: #ffffff; margin: 0;">New Contact Form Submission</h2>
                </div>
                <div style="padding: 32px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; font-weight: bold; color: #555; width: 120px;">Name</td>
                            <td style="padding: 10px 0; color: #111;">${fullName}</td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 10px 0; font-weight: bold; color: #555;">Email</td>
                            <td style="padding: 10px 0; color: #111;"><a href="mailto:${email}">${email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; font-weight: bold; color: #555;">Subject</td>
                            <td style="padding: 10px 0; color: #111;">${subject}</td>
                        </tr>
                    </table>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
                    <h4 style="color: #555; margin-bottom: 8px;">Message</h4>
                    <p style="color: #111; line-height: 1.7; white-space: pre-line;">${message}</p>
                </div>
                <div style="background: #f5f5f5; padding: 16px 32px; text-align: center; font-size: 12px; color: #999;">
                    Sent from your website contact form
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: "Email sent successfully!" });
    } catch (error) {
        console.error("Nodemailer error:", error);
        return res.status(500).json({ success: false, error: "Failed to send email. Please try again." });
    }
});


// POST /send-mail
router.post('/send-formlink', async (req, res) => {
  try {
    const { emails, formLink } = req.body;

    if (!emails || !emails.length) {
      return res.status(400).json({ message: 'Email required' });
    }

    // Configure transporter (Gmail example)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,   // your email
        pass: process.env.GMAIL_PASS    // app password
      }
    });

    // HTML Template
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; padding:20px; border-radius:8px;">
          
          <h2 style="color:#333;">Hello 👋</h2>
          
          <p style="font-size:14px; color:#555;">
            You have received a request to fill out the form. Please click the button below to proceed.
          </p>

          <div style="text-align:center; margin:30px 0;">
            <a href="${formLink}" 
               style="background:#007bff; color:#fff; padding:12px 20px; text-decoration:none; border-radius:5px; display:inline-block;">
              Open Form
            </a>
          </div>

          <p style="font-size:12px; color:#888;">
            If the button doesn't work, use this link:<br/>
            <a href="${formLink}">${formLink}</a>
          </p>

          <hr style="margin:30px 0;" />

          <!-- Footer -->
          <div style="text-align:center;">
            <img 
              src="http://localhost:5173/logo.png" 
              alt="Company Logo" 
              style="width:120px; margin-bottom:10px;"
            />
            <p style="font-size:12px; color:#999;">
              © ${new Date().getFullYear()} Your Company. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    `;

    // Mail Options
    const mailOptions = {
      from: `"MYSDOM" <${process.env.EMAIL_USER}>`,
      to: emails, // array of emails
      subject:'Form Submission Request',
      html: htmlTemplate
    };

    // Send Mail
    const info = await transporter.sendMail(mailOptions);

    res.status(ResponseCodes.SUCCESS).json({
      status:ResponseCodes.SUCCESS,
      error:{},
      data:{
          messageId: info.messageId
      },
      message: 'Emails sent successfully',
    });

  } catch (error) {
    console.error('Mail Error:', error);
    res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
        status:ResponseCodes.INTERNAL_SERVER_ERROR,
        data:{},
        error:error,
        message: 'Failed to send emails' 
    });
  }
});


module.exports = router;