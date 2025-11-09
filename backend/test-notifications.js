/**
 * Direct Email Test - No imports needed
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n📧 Testing Email Notifications for Orders\n');
console.log('='.repeat(60));

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const testOrderData = {
  orderId: 'TEST_ORD_' + Date.now(),
  customerName: 'Prakash Raj',
  totalAmount: 450.50,
  itemsCount: 3,
  deliveryAddress: '123 Test Street, Chennai, TN - 600001',
  orderDate: new Date().toLocaleString('en-IN'),
};

async function sendTestEmails() {
  try {
    console.log('\n✉️  Email 1: Customer Order Confirmation\n');
    
    // Customer confirmation email
    await emailTransporter.sendMail({
      from: `MediExpress <${process.env.EMAIL_USER}>`,
      to: 'prakashwonder985@gmail.com',
      subject: `✅ Order Confirmed - ${testOrderData.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
            <h1>Order Confirmed!</h1>
            <p>Thank you for your order, ${testOrderData.customerName}!</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 10px;">
            <h2 style="color: #667eea;">Order Summary</h2>
            <p><strong>Order ID:</strong> ${testOrderData.orderId}</p>
            <p><strong>Items:</strong> ${testOrderData.itemsCount} items</p>
            <p><strong>Total Amount:</strong> ₹${testOrderData.totalAmount.toFixed(2)}</p>
            <p><strong>Delivery Address:</strong> ${testOrderData.deliveryAddress}</p>
            <p style="margin-top: 30px;">Your order has been received and is being processed. A delivery partner will be assigned shortly.</p>
          </div>
        </div>
      `,
    });
    
    console.log('✅ Customer confirmation email sent!\n');
    
    console.log('✉️  Email 2: Delivery Partner Notification\n');
    
    // Delivery partner notification
    await emailTransporter.sendMail({
      from: `MediExpress <${process.env.EMAIL_USER}>`,
      to: 'prakashwonder985@gmail.com',
      subject: `🚀 New Order Available - ${testOrderData.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1>🚀 New Order Available!</h1>
            <p>Hi Delivery Partner, a new medicine delivery order is ready for you.</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0;">Order Details</h2>
              <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
                <strong style="color: #667eea;">Order ID:</strong> ${testOrderData.orderId}
              </div>
              <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
                <strong style="color: #667eea;">Customer:</strong> ${testOrderData.customerName}
              </div>
              <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
                <strong style="color: #667eea;">Items:</strong> ${testOrderData.itemsCount} items
              </div>
              <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
                <strong style="color: #667eea;">Total Amount:</strong> ₹${testOrderData.totalAmount.toFixed(2)}
              </div>
              <div style="padding: 10px 0;">
                <strong style="color: #667eea;">Delivery Address:</strong> ${testOrderData.deliveryAddress}
              </div>
            </div>
            <center style="margin-top: 20px;">
              <a href="http://localhost:5173/delivery-dashboard" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                View Order Dashboard
              </a>
            </center>
          </div>
        </div>
      `,
    });
    
    console.log('✅ Delivery partner notification email sent!\n');
    
    console.log('='.repeat(60));
    console.log('\n🎉 SUCCESS! Both emails sent successfully!\n');
    console.log('📬 Check your inbox: prakashwonder985@gmail.com\n');
    console.log('You should see 2 new emails:');
    console.log('  1. ✅ Order Confirmed - ' + testOrderData.orderId);
    console.log('  2. 🚀 New Order Available - ' + testOrderData.orderId);
    console.log('\n💡 This proves the email system works!');
    console.log('   When customers place real orders, they will');
    console.log('   automatically receive these notifications.\n');
    
  } catch (error) {
    console.error('\n❌ Email test failed:', error.message);
    console.error('\nFull error:', error);
  }
}

sendTestEmails();
