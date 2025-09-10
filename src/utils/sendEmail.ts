import nodemailer from 'nodemailer'

interface MailOptions {
  to: string
  subject: string
  html: string
}

const transporter = nodemailer.createTransport({
  host: 'localhost', // MailHog SMTP host
  port: 1025, // MailHog SMTP port
  secure: false, // MailHog does not use TLS
  auth: undefined, // no authentication needed
})

export async function sendEmail(options: MailOptions) {
  try {
    const info = await transporter.sendMail({
      from: 'no-reply@example.com', // can be any sender address
      ...options,
    })
    console.log(`✅ Email sent successfully to ${options.to}: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  }
  catch (error: any) {
    console.error(`❌ Error sending email: ${error}`)
    return { success: false, error: error.message }
  }
}
