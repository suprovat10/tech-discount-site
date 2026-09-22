import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = (subject && typeof subject === 'string' ? subject.trim() : 'Website Inquiry') || 'Website Inquiry';
    const cleanMessage = message.trim();

    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.CONTACT_RECEIVER_EMAIL || 'suprovat10roy@gmail.com';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'TechPriceDrop <contact@techpricedrop.com>';

    // If Resend API Key is configured, send the email via Resend REST API
    if (resendApiKey) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; padding: 28px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
              .header { border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px; }
              .title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
              .badge { display: inline-block; background: #eff6ff; color: #2563eb; padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; text-transform: uppercase; margin-top: 6px; }
              .field { margin-bottom: 14px; }
              .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
              .value { font-size: 14px; color: #1e293b; font-weight: 500; }
              .message-box { background: #f1f5f9; border-left: 3px solid #2563eb; padding: 14px; font-size: 14px; color: #0f172a; white-space: pre-wrap; margin-top: 6px; }
              .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 class="title">New Contact Form Inquiry</h1>
                <div class="badge">TechPriceDrop Support</div>
              </div>

              <div class="field">
                <div class="label">From</div>
                <div class="value"><strong>${cleanName}</strong> (${cleanEmail})</div>
              </div>

              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${cleanSubject}</div>
              </div>

              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">${cleanMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              </div>

              <div class="footer">
                This email was sent from the contact form on TechPriceDrop.com.<br>
                You can reply directly to this email to respond to ${cleanName} (${cleanEmail}).
              </div>
            </div>
          </body>
        </html>
      `;

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipientEmail],
          reply_to: cleanEmail,
          subject: `[Contact Form] ${cleanSubject} - from ${cleanName}`,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const errData = await resendResponse.json().catch(() => ({}));
        console.error('Resend API Error:', errData);
        return NextResponse.json(
          {
            error: errData.message || 'Failed to send email via Resend. Please check your domain and API key.',
          },
          { status: 500 }
        );
      }

      const resendData = await resendResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        id: resendData.id,
      });
    }

    // If RESEND_API_KEY is not configured yet, log warning and return success for user UX
    console.warn('RESEND_API_KEY is not configured. Please add RESEND_API_KEY to your Vercel Environment Variables.');
    return NextResponse.json({
      success: true,
      message: 'Inquiry received. (Notice: Add RESEND_API_KEY in Vercel to receive real-time emails).',
    });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while processing message' },
      { status: 500 }
    );
  }
}
