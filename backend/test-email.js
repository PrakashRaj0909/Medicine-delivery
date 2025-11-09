/**
 * Test Email Configuration
 * Run this to verify your Gmail setup is working
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('\n🧪 Testing Email Configuration...\n');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set (hidden)' : '❌ Not set');
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false // Fix SSL certificate issue
      }
    });

    console.log('\n📧 Verifying connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    // Send test email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `MediExpress Test <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '✅ Test Email - MediExpress Notification System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1>✅ Email System Working!</h1>
            <p>Your MediExpress notification system is properly configured.</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 10px;">
            <h2 style="color: #667eea;">Test Successful</h2>
            <p>This confirms that:</p>
            <ul>
              <li>✅ Gmail credentials are correct</li>
              <li>✅ App Password is valid</li>
              <li>✅ SMTP connection is working</li>
              <li>✅ Emails can be sent</li>
            </ul>
            <p style="margin-top: 30px;">
              <strong>Next step:</strong> Place a test order and delivery partners will receive email notifications!
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>MediExpress - Medicine Delivery Platform</p>
            <p>Test sent at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log(`\n💡 Check your inbox: ${process.env.EMAIL_USER}\n`);
    
  } catch (error) {
    console.error('\n❌ Email test failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔧 Fix: Your App Password might be incorrect');
      console.log('   1. Go to: https://myaccount.google.com/apppasswords');
      console.log('   2. Generate a new App Password');
      console.log('   3. Update EMAIL_PASSWORD in .env (remove spaces)\n');
    } else if (error.message.includes('EAUTH')) {
      console.log('\n🔧 Fix: Authentication failed');
      console.log('   - Make sure 2FA is enabled on your Gmail account');
      console.log('   - Use App Password, not your regular password\n');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Fix: Network/DNS issue');
      console.log('   - Check your internet connection');
      console.log('   - Verify firewall settings\n');
    }
    
    console.error('\nFull error:', error);
  }
}

testEmail();
