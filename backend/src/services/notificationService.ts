/**
 * Notification Service for Email and SMS
 * Sends notifications to delivery partners when new orders are placed
 */

import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

console.log('🔍 Email Configuration Check:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER);
console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `${process.env.EMAIL_PASSWORD.substring(0, 4)}****` : '❌ NOT SET');

// Email configuration (using Gmail as example - you can change to your provider)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

// Verify email configuration on startup
emailTransporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    console.error('   Please check your EMAIL_USER and EMAIL_PASSWORD in .env file');
  } else {
    console.log('✅ Email server is ready to send messages');
    console.log('   Email User:', process.env.EMAIL_USER);
  }
});

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export interface NotificationData {
  orderId: string;
  customerName: string;
  totalAmount: number;
  itemsCount: number;
  deliveryAddress: string;
  orderDate: string;
}

class NotificationService {
  /**
   * Send email notification to delivery partner
   */
  async sendEmailNotification(
    email: string,
    partnerName: string,
    orderData: NotificationData
  ): Promise<boolean> {
    try {
      console.log(`📧 Attempting to send email to: ${email}`);
      console.log(`   From: ${process.env.EMAIL_USER}`);
      console.log(`   Order ID: ${orderData.orderId}`);
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'MediExpress <noreply@mediexpress.com>',
        to: email,
        subject: `🚀 New Order Available - ${orderData.orderId}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .order-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .order-detail { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .order-detail:last-child { border-bottom: none; }
                .label { font-weight: bold; color: #667eea; }
                .value { color: #333; }
                .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🚀 New Order Available!</h1>
                  <p>Hi ${partnerName}, a new medicine delivery order is ready for you.</p>
                </div>
                <div class="content">
                  <div class="order-card">
                    <h2 style="color: #667eea; margin-top: 0;">Order Details</h2>
                    <div class="order-detail">
                      <span class="label">Order ID:</span>
                      <span class="value">${orderData.orderId}</span>
                    </div>
                    <div class="order-detail">
                      <span class="label">Customer:</span>
                      <span class="value">${orderData.customerName}</span>
                    </div>
                    <div class="order-detail">
                      <span class="label">Items:</span>
                      <span class="value">${orderData.itemsCount} items</span>
                    </div>
                    <div class="order-detail">
                      <span class="label">Total Amount:</span>
                      <span class="value">₹${orderData.totalAmount.toFixed(2)}</span>
                    </div>
                    <div class="order-detail">
                      <span class="label">Delivery Address:</span>
                      <span class="value">${orderData.deliveryAddress}</span>
                    </div>
                    <div class="order-detail">
                      <span class="label">Order Date:</span>
                      <span class="value">${orderData.orderDate}</span>
                    </div>
                  </div>
                  <center>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/delivery-dashboard" class="cta-button">
                      View Order Dashboard
                    </a>
                  </center>
                  <p style="text-align: center; color: #666; margin-top: 20px;">
                    Login to your delivery dashboard to accept and start delivery.
                  </p>
                </div>
                <div class="footer">
                  <p>MediExpress - Fast & Reliable Medicine Delivery</p>
                  <p>This is an automated notification. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      const info = await emailTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${email}`);
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Response: ${info.response}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Email sending failed to ${email}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Code: ${error.code}`);
      if (error.command) {
        console.error(`   Command: ${error.command}`);
      }
      return false;
    }
  }

  /**
   * Send SMS notification to delivery partner
   */
  async sendSMSNotification(
    phoneNumber: string,
    partnerName: string,
    orderData: NotificationData
  ): Promise<boolean> {
    try {
      if (!twilioClient) {
        console.log('⚠️  Twilio not configured. Skipping SMS notification.');
        return false;
      }

      const message = `🚀 New Order Alert!\n\nHi ${partnerName},\n\nOrder ID: ${orderData.orderId}\nCustomer: ${orderData.customerName}\nAmount: ₹${orderData.totalAmount}\nItems: ${orderData.itemsCount}\n\nLogin to your dashboard to accept this order.\n\n- MediExpress`;

      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to: phoneNumber,
      });

      console.log(`✅ SMS sent to ${phoneNumber} for order ${orderData.orderId}`);
      return true;
    } catch (error) {
      console.error('❌ SMS sending failed:', error);
      return false;
    }
  }

  /**
   * Notify all available delivery partners about a new order
   */
  async notifyDeliveryPartners(
    deliveryPartners: Array<{ name: string; email: string; phone?: string }>,
    orderData: NotificationData
  ): Promise<void> {
    console.log(`\n📢 Notifying ${deliveryPartners.length} delivery partner(s) about new order ${orderData.orderId}...`);

    for (const partner of deliveryPartners) {
      // Send email notification
      await this.sendEmailNotification(partner.email, partner.name, orderData);

      // Send SMS notification if phone number is available
      if (partner.phone) {
        await this.sendSMSNotification(partner.phone, partner.name, orderData);
      }
    }

    console.log(`✅ Notifications sent to all delivery partners\n`);
  }

  /**
   * Send order confirmation email to customer
   */
  async sendOrderConfirmationEmail(
    customerEmail: string,
    customerName: string,
    orderData: NotificationData
  ): Promise<boolean> {
    try {
      console.log(`📧 Sending order confirmation to: ${customerEmail}`);
      console.log(`   Order ID: ${orderData.orderId}`);
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'MediExpress <noreply@mediexpress.com>',
        to: customerEmail,
        subject: `✅ Order Confirmed - ${orderData.orderId}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-icon { font-size: 60px; margin-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="success-icon">✅</div>
                  <h1>Order Confirmed!</h1>
                  <p>Thank you for your order, ${customerName}!</p>
                </div>
                <div class="content">
                  <h2 style="color: #667eea;">Order Summary</h2>
                  <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                  <p><strong>Items:</strong> ${orderData.itemsCount} items</p>
                  <p><strong>Total Amount:</strong> ₹${orderData.totalAmount.toFixed(2)}</p>
                  <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
                  <p style="margin-top: 30px;">Your order has been received and is being processed. A delivery partner will be assigned shortly.</p>
                  <p>Track your order status in the Orders section of your dashboard.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      const info = await emailTransporter.sendMail(mailOptions);
      console.log(`✅ Order confirmation email sent to ${customerEmail}`);
      console.log(`   Message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Order confirmation email failed to ${customerEmail}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Code: ${error.code}`);
      return false;
    }
  }
}

export default new NotificationService();
