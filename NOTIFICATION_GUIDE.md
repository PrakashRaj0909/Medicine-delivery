# 📧 Email & SMS Notification System Guide

## Overview

When a customer places an order, the system automatically sends:
- ✅ **Email confirmation** to the customer
- 📧 **Email notifications** to all available delivery partners
- 📱 **SMS notifications** to all delivery partners (if configured)

---

## 🚀 Quick Setup

### Step 1: Configure Email (Gmail Example)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

3. **Update `.env` file** in backend folder:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### Step 2: Configure SMS (Optional - Twilio)

1. **Sign up** at https://www.twilio.com (free trial available)
2. **Get credentials** from Twilio Console:
   - Account SID
   - Auth Token
   - Phone Number

3. **Update `.env` file**:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 📬 What Gets Sent

### Customer Email (Order Confirmation)
```
Subject: ✅ Order Confirmed - ORD123456

Hi Customer Name!

Order Summary:
- Order ID: ORD123456
- Items: 3 items
- Total: ₹450.00
- Delivery Address: [Full Address]

Your order is being processed...
```

### Delivery Partner Email
```
Subject: 🚀 New Order Available - ORD123456

Hi Delivery Partner!

New Order Details:
- Order ID: ORD123456
- Customer: Customer Name
- Items: 3 items
- Amount: ₹450.00
- Address: [Full Address]

[View Order Dashboard Button]
```

### Delivery Partner SMS
```
🚀 New Order Alert!

Hi Partner Name,

Order ID: ORD123456
Customer: Customer Name
Amount: ₹450
Items: 3

Login to accept this order.

- MediExpress
```

---

## 🎯 How It Works

1. **Customer places order** → Backend creates order in database
2. **Backend finds all available delivery partners** (`isAvailable: true`, `isOnline: true`)
3. **Sends email to customer** with order confirmation
4. **Sends email + SMS to ALL delivery partners** simultaneously
5. **First partner to accept** gets the order

---

## 🧪 Testing

### Test Without Email/SMS (Default)
If you don't configure email/SMS, the system will:
- ✅ Still create orders normally
- ⚠️ Log "Email not configured" or "SMS not configured" 
- ✅ Orders work perfectly without notifications

### Test With Email Only
```bash
# Set in .env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Leave SMS empty
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
```

Result: Emails sent ✅, SMS skipped ⚠️

### Test With Email + SMS
```bash
# Set both in .env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_PHONE_NUMBER=+1234567890
```

Result: Both sent ✅

---

## 📊 Backend Logs

When an order is placed, you'll see:
```
📢 Notifying 3 delivery partner(s) about new order ORD123456...
✅ Email sent to partner1@email.com for order ORD123456
✅ SMS sent to +91-9876543210 for order ORD123456
✅ Email sent to partner2@email.com for order ORD123456
⚠️  Twilio not configured. Skipping SMS notification.
✅ Notifications sent to all delivery partners

✅ Order confirmation email sent to customer@email.com
```

---

## 🔧 Troubleshooting

### Email Not Sending

**Problem**: "Invalid login: Application-specific password required"
**Solution**: Use App Password, not your regular Gmail password

**Problem**: "Connection timeout"
**Solution**: Check firewall or try different email provider

### SMS Not Sending

**Problem**: "Authentication failed"
**Solution**: Double-check Twilio credentials in `.env`

**Problem**: "Phone number not verified"
**Solution**: Verify phone numbers in Twilio Console (required for trial accounts)

---

## 🎨 Email Templates

The emails include:
- ✨ Professional HTML design
- 📱 Mobile-responsive layout
- 🎨 Gradient header with brand colors
- 🔘 Call-to-action button
- 📋 Formatted order details

---

## 🔐 Security Notes

1. **Never commit `.env` file** to git
2. **Use App Passwords**, not regular passwords
3. **Rotate credentials** periodically
4. **Rate limit** notifications in production

---

## 💡 Pro Tips

### For Development
- Use free email services (Gmail, Outlook)
- Use Twilio trial (free $15 credit)
- Test with your own email/phone first

### For Production
- Use transactional email service (SendGrid, AWS SES)
- Use professional SMS provider (Twilio paid plan)
- Add email templates customization
- Implement retry logic for failed notifications

---

## 📝 Environment Variables Reference

```env
# Required for email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Optional for SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Other settings
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/mediexpress
JWT_SECRET=your-secret-key
```

---

## 🚀 Next Steps

1. Copy `.env.example` to `.env`
2. Fill in your email credentials
3. (Optional) Add Twilio credentials for SMS
4. Restart backend: `npm run dev`
5. Place a test order and check email/SMS!

---

## 📞 Support

- **Email issues**: Check Gmail App Password setup
- **SMS issues**: Check Twilio Console
- **General**: Check backend logs for error messages

Happy delivering! 🎉
