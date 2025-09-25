import nodemailer from 'nodemailer';
import { AppError } from '../utils/errors';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter
    if (process.env.NODE_ENV === 'production') {
      // Production email service (e.g., SendGrid, AWS SES)
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      // Development: Use Ethereal Email
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass',
        },
      });
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"AdvisorAI Hub" <${process.env.EMAIL_FROM || 'noreply@advisorai.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('Email send error:', error);
      throw new AppError('Failed to send email', 500);
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; margin: 20px 0; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to AdvisorAI Hub!</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for signing up! Please click the button below to verify your email address and activate your account.</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>Or copy and paste this link into your browser:</p>
              <p>${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <hr>
              <p><small>If you didn't create an account with AdvisorAI Hub, please ignore this email.</small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify your AdvisorAI Hub email',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; margin: 20px 0; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to create a new password.</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p>${resetUrl}</p>
              <p>This link will expire in 1 hour.</p>
              <hr>
              <p><small>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset your AdvisorAI Hub password',
      html,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .feature { margin: 20px 0; padding: 15px; background-color: white; border-left: 4px solid #10B981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to AdvisorAI Hub!</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Your account is now active. Here's what you can do with AdvisorAI Hub:</p>
              
              <div class="feature">
                <h3>🚀 Marketing Advisor</h3>
                <p>Generate compelling ad copy, social media posts, and email campaigns.</p>
              </div>
              
              <div class="feature">
                <h3>⚙️ Operations Advisor</h3>
                <p>Automate invoicing, scheduling, and inventory management.</p>
              </div>
              
              <div class="feature">
                <h3>🎧 Customer Support Advisor</h3>
                <p>Deploy AI chatbots and manage customer tickets efficiently.</p>
              </div>
              
              <div class="feature">
                <h3>🛡️ Compliance Advisor</h3>
                <p>Stay compliant with industry-specific checklists and templates.</p>
              </div>
              
              <p>Get started by logging into your dashboard:</p>
              <a href="${process.env.FRONTEND_URL}/dashboard" style="color: #10B981;">Go to Dashboard →</a>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to AdvisorAI Hub!',
      html,
    });
  }
}

export const emailService = new EmailService();
