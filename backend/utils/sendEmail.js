import nodemailer from "nodemailer";

export const sendBookingConfirmationEmail = async (to, booking) => {
  try {
    console.log(
      "DEBUG USER:",
      process.env.EMAIL_USER,
      "| DEBUG PASS:",
      process.env.EMAIL_PASS ? "SET (" + process.env.EMAIL_PASS.length + " chars)" : "MISSING"
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"TravelMate AI" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Booking Received — ${booking.packageName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Booking Request Received!</h2>
          <p>Hi ${booking.name},</p>
          <p>Thanks for booking with TravelMate AI. Here are your trip details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #666;">Package</td><td style="padding: 8px 0; font-weight: bold;">${booking.packageName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0;">${booking.date}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Travelers</td><td style="padding: 8px 0;">${booking.travelers}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Total</td><td style="padding: 8px 0; font-weight: bold; color: #0ea5e9;">$${booking.total}</td></tr>
          </table>
          <p>Your booking status is currently <strong>Pending</strong>. We'll notify you once it's confirmed.</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— TravelMate AI</p>
        </div>
      `,
    });
    console.log("Booking email sent:", info.messageId);
  } catch (error) {
    console.error("Email failed to send:", error.message);
  }
};