import nodemailer from 'nodemailer'
import { env } from '../config/env'

interface MailOptions {
  to: string
  subject: string
  html: string
}

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
})

export async function sendEmail(options: MailOptions) {
  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      ...options,
    })
    console.log(`✅ Email sent successfully to ${options.to}: ${info.messageId}`)
    return info
  }
  catch (error) {
    console.error(`❌ Error sending email: ${error}`)
    // In prod we use robust logging service
  }
}
