import { Resend } from "resend";

export const sendBookingConfirmationEmail = async (to, booking) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "TravelMate AI <onboarding@resend.dev>",
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
  } catch (error) {
    console.error("Email failed to send:", error.message);
  }
};