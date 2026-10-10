import { Resend } from "resend";

// Escape user-supplied text before putting it into HTML.
const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Created on first use so process.env is already loaded by dotenv.
let resendClient;
const getResend = () => {
  const key = (process.env.RESEND_API_KEY || "").trim();
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
};

export const sendBookingConfirmationEmail = async (to, booking) => {
  try {
    const resend = getResend();
    if (!resend) {
      console.error("Email not sent: RESEND_API_KEY is missing.");
      return;
    }

    // Until you verify your own domain in Resend, use the default sender below.
    // With the default sender, Resend only delivers to the email you signed up with.
    const from = process.env.EMAIL_FROM || "TravelMate AI <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: `Booking Received — ${booking.packageName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Booking Request Received!</h2>
          <p>Hi ${esc(booking.name)},</p>
          <p>Thanks for booking with TravelMate AI. Here are your trip details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #666;">Package</td><td style="padding: 8px 0; font-weight: bold;">${esc(booking.packageName)}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0;">${esc(booking.date)}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Travelers</td><td style="padding: 8px 0;">${esc(booking.travelers)}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Total</td><td style="padding: 8px 0; font-weight: bold; color: #0ea5e9;">$${esc(booking.total)}</td></tr>
          </table>
          <p>Your booking status is currently <strong>Pending</strong>. We'll notify you once it's confirmed.</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— TravelMate AI</p>
        </div>
      `,
    });

    if (error) {
      console.error("Email failed to send:", error.message || error);
      return;
    }
    console.log("Booking email sent:", data?.id);
  } catch (err) {
    console.error("Email failed to send:", err.message);
  }
};