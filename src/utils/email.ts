import { SMTPClient } from 'emailjs'
import { TokenType } from '@prisma/client'

import nodemailer from 'nodemailer';

const client = new SMTPClient({
	user: process.env.EMAIL_APP_USER,
	password: process.env.EMAIL_APP_PASSWORD,
	host: 'smtp.gmail.com',
	ssl: true,
})

export async function sendConfirmationEmail(email: string, confirmationLink: string, type: TokenType) {

  const subject =
  type === 'EMAIL_VERIFICATION' ? 'Confirm your Email' : 'Reset your Password';

  const htmlContent = `
        <h1>${subject}</h1>
        <p>Click the link below to ${
          type === 'EMAIL_VERIFICATION' ? 'confirm your email' : 'reset your password'
        }:</p>
        <a href="${confirmationLink}">${
        type === 'EMAIL_VERIFICATION' ? 'Confirm Email' : 'Reset Password'
        }</a>
        <p>This link will expire in ${type === 'RESET_PASSWORD' ? '10 minutes' : '1 hour'}.</p>
      `;

  return new Promise((resolve, reject) => {
    client.send(
      {
        text: "i hope this works",
        from: process.env.EMAIL_APP_USER as string,
        to: email, 
        subject,
        attachment: [{data: htmlContent, alternative: true}],
      },
      (err, message) => {
        if (err) reject(err)
        else resolve(message)
      }
    )
  })
}