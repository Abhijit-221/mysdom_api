const express = require("express");
const nodemailer = require("nodemailer");
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

module.exports = router;