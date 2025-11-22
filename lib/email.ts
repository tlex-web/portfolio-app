import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface FeedbackEmailData {
  name: string;
  email: string;
  message: string;
  interestedInCollaboration?: boolean;
  timestamp: string;
  ip: string;
}

/**
 * Sends a feedback email using Resend
 * @param data - Feedback form data
 * @returns Promise that resolves when email is sent
 * @throws Error if email sending fails
 */
export async function sendFeedbackEmail(data: FeedbackEmailData): Promise<void> {
  const recipientEmail = process.env.FEEDBACK_RECIPIENT_EMAIL;
  const fromEmail = process.env.FEEDBACK_FROM_EMAIL || 'onboarding@resend.dev';

  if (!recipientEmail) {
    throw new Error('FEEDBACK_RECIPIENT_EMAIL environment variable is not set');
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const htmlContent = generateEmailHTML(data);
  const textContent = generateEmailText(data);

  try {
    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Portfolio Feedback from ${data.name}`,
      html: htmlContent,
      text: textContent,
      replyTo: data.email, // Allow easy reply to the sender
    });
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    throw new Error('Failed to send feedback email');
  }
}

/**
 * Generates HTML email template with branded styling
 */
function generateEmailHTML(data: FeedbackEmailData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portfolio Feedback</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    New Portfolio Feedback
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  
                  <!-- Sender Info -->
                  <div style="margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-left: 4px solid #06b6d4; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      From
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a; font-weight: 600;">
                      ${escapeHtml(data.name)}
                    </p>
                    <p style="margin: 0; font-size: 16px; color: #3b82f6;">
                      <a href="mailto:${escapeHtml(data.email)}" style="color: #3b82f6; text-decoration: none;">
                        ${escapeHtml(data.email)}
                      </a>
                    </p>
                  </div>
                  
                  <!-- Message -->
                  <div style="margin-bottom: 30px;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Message
                    </p>
                    <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                      <p style="margin: 0; font-size: 16px; color: #334155; line-height: 1.6; white-space: pre-wrap;">
${escapeHtml(data.message)}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Collaboration Interest -->
                  ${data.interestedInCollaboration ? `
                  <div style="margin-bottom: 30px; padding: 16px 20px; background-color: #ecfeff; border: 1px solid #06b6d4; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #0e7490; font-weight: 600;">
                      ✨ Interested in collaboration opportunities
                    </p>
                  </div>
                  ` : ''}
                  
                  <!-- Metadata -->
                  <div style="padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #94a3b8;">
                      <strong>Received:</strong> ${new Date(data.timestamp).toLocaleString('en-US', { 
                        dateStyle: 'full', 
                        timeStyle: 'long' 
                      })}
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                      <strong>IP Address:</strong> ${escapeHtml(data.ip)}
                    </p>
                  </div>
                  
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 13px; color: #64748b;">
                    This message was sent via your portfolio website contact form
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Generates plain text email content (fallback for non-HTML clients)
 */
function generateEmailText(data: FeedbackEmailData): string {
  return `
NEW PORTFOLIO FEEDBACK
${'='.repeat(50)}

FROM: ${data.name}
EMAIL: ${data.email}
${data.interestedInCollaboration ? 'INTERESTED IN COLLABORATION: Yes\n' : ''}

MESSAGE:
${'-'.repeat(50)}
${data.message}
${'-'.repeat(50)}

RECEIVED: ${new Date(data.timestamp).toLocaleString('en-US', { 
    dateStyle: 'full', 
    timeStyle: 'long' 
  })}
IP ADDRESS: ${data.ip}

---
This message was sent via your portfolio website contact form.
Reply directly to this email to respond to ${data.name}.
  `.trim();
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
