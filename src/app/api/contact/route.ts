import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, topic, orderNumber, comment } = body

    // Validate required fields
    if (!name || !email || !topic || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create email transport
    // For MailHog (local testing): host: localhost, port: 1025
    // For GoDaddy/Production: use your SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      // Ignore TLS errors for MailHog
      tls: {
        rejectUnauthorized: false
      }
    })

    // Map topic values to readable labels
    const topicLabels: Record<string, string> = {
      order_problem: 'Problem with Order',
      website_issue: 'Website Issue',
      product_question: 'Product Question',
      custom_request: 'Custom Design Request',
      other: 'Other'
    }

    // Email content
    const emailHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
      <p><strong>Topic:</strong> ${topicLabels[topic] || topic}</p>
      ${orderNumber ? `<p><strong>Order Number:</strong> ${orderNumber}</p>` : ''}
      <hr>
      <h3>Message:</h3>
      <p>${comment.replace(/\n/g, '<br>')}</p>
    `

    const emailText = `
New Contact Form Submission

From: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
Topic: ${topicLabels[topic] || topic}
${orderNumber ? `Order Number: ${orderNumber}` : ''}

Message:
${comment}
    `

    // Route to appropriate email based on topic
    const getRecipientEmail = (topic: string): string => {
      switch(topic) {
        case 'order_problem':
          return process.env.ORDERS_EMAIL || process.env.CONTACT_EMAIL || 'orders@crystalkeepsakes.com'
        case 'website_issue':
          return process.env.SUPPORT_EMAIL || process.env.CONTACT_EMAIL || 'support@crystalkeepsakes.com'
        case 'custom_request':
          return process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || 'admin@crystalkeepsakes.com'
        default:
          return process.env.CONTACT_EMAIL || 'info@crystalkeepsakes.com'
      }
    }

    const recipientEmail = getRecipientEmail(topic)

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"CrystalKeepsakes Contact" <noreply@crystalkeepsakes.com>',
      to: recipientEmail,
      replyTo: email,
      subject: `Contact Form: ${topicLabels[topic] || topic} - ${name}`,
      text: emailText,
      html: emailHtml,
    })

    // Send confirmation email to customer
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"CrystalKeepsakes" <noreply@crystalkeepsakes.com>',
      to: email,
      subject: 'We received your message - CrystalKeepsakes',
      html: `
        <h2>Thank you for contacting CrystalKeepsakes!</h2>
        <p>Hi ${name},</p>
        <p>We've received your message regarding: <strong>${topicLabels[topic] || topic}</strong></p>
        <p>Our team will review your inquiry and get back to you as soon as possible.</p>
        ${orderNumber ? `<p>Reference Order Number: ${orderNumber}</p>` : ''}
        <hr>
        <p><em>Your message:</em></p>
        <p>${comment.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>Best regards,<br>The CrystalKeepsakes Team</p>
      `,
      text: `
Thank you for contacting CrystalKeepsakes!

Hi ${name},

We've received your message regarding: ${topicLabels[topic] || topic}

Our team will review your inquiry and get back to you as soon as possible.
${orderNumber ? `\nReference Order Number: ${orderNumber}` : ''}

---
Your message:
${comment}
---

Best regards,
The CrystalKeepsakes Team
      `
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully' 
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    )
  }
}
