// Order Email API - Development/Mailhog compatible
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    const { orderId, paymentId, cartItems, shippingInfo, receipt_email, cockpit3dOrderId, cockpit3dStatus } = orderData

    if (!orderId || !cartItems) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create email transport for Mailhog
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: false,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      tls: {
        rejectUnauthorized: false
      }
    })

    // Build email HTML
    let emailHtml = `
      <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>New Order: #${orderId}</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        ${paymentId ? `<p><strong>Payment ID:</strong> ${paymentId}</p>` : ''}
        ${cockpit3dOrderId ? `<p><strong>Cockpit3D Order ID:</strong> ${cockpit3dOrderId}</p>` : ''}
        ${cockpit3dStatus ? `<p><strong>Cockpit3D Status:</strong> ${cockpit3dStatus}</p>` : ''}
    `

    // Customer info
    if (shippingInfo) {
      emailHtml += `
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${shippingInfo.name || 'N/A'}</p>
        <p><strong>Email:</strong> ${receipt_email || shippingInfo.email || 'N/A'}</p>
        ${shippingInfo.phone ? `<p><strong>Phone:</strong> ${shippingInfo.phone}</p>` : ''}
      `

      if (shippingInfo.address) {
        const addr = shippingInfo.address
        emailHtml += `
          <p><strong>Address:</strong><br>
          ${addr.line1 || ''}<br>
          ${addr.line2 ? addr.line2 + '<br>' : ''}
          ${addr.city || ''}, ${addr.state || ''} ${addr.postal_code || ''}<br>
          ${addr.country || ''}
          </p>
        `
      }
    }

    // Order items
    if (cartItems && cartItems.length > 0) {
      emailHtml += `
        <h3>Order Items</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <tr style="background: #f0f0f0;">
            <th>Product</th>
            <th>Options</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
      `

      let total = 0
      cartItems.forEach((item: any) => {
        emailHtml += `<tr>`
        emailHtml += `<td>${item.name || 'Unknown'}</td>`

        // Options
        let optionsHtml = ''
        if (item.options) {
          Object.entries(item.options).forEach(([key, value]: [string, any]) => {
            if (['imageUrl', 'maskedImageUrl', 'rawImageUrl'].includes(key)) return
            
            if (key === 'customText' && typeof value === 'object') {
              if (value.line1) optionsHtml += `<strong>Line 1:</strong> ${value.line1}<br>`
              if (value.line2) optionsHtml += `<strong>Line 2:</strong> ${value.line2}<br>`
            } else if (value && typeof value !== 'object') {
              optionsHtml += `<strong>${key}:</strong> ${value}<br>`
            }
          })
        }

        emailHtml += `<td>${optionsHtml || 'None'}</td>`
        emailHtml += `<td>${item.quantity || 1}</td>`
        emailHtml += `<td>$${(item.price || 0).toFixed(2)}</td>`
        emailHtml += `</tr>`

        total += (item.price || 0) * (item.quantity || 1)
      })

      emailHtml += `
          <tr style="background: #f9f9f9; font-weight: bold;">
            <td colspan="3" align="right">Total:</td>
            <td>$${total.toFixed(2)}</td>
          </tr>
        </table>
      `
    }

    emailHtml += `</body></html>`

    // Send to admin
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"CrystalKeepsakes Orders" <noreply@crystalkeepsakes.com>',
      to: process.env.ORDERS_EMAIL || 'orders@crystalkeepsakes.com',
      subject: `New Order: ${orderId}`,
      html: emailHtml,
    })

    console.log('✅ Order email sent via Mailhog')

    return NextResponse.json({ 
      success: true, 
      message: 'Order email sent' 
    })
  } catch (error: any) {
    console.error('❌ Order email error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
