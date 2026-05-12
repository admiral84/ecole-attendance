// app/actions/sendEmail.js
'use server';

import { Resend } from 'resend';

export async function testResendEmail(email) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'delivered@resend.dev',
      to: [email],
      subject: 'Test Email',
      html: '<p>Working!</p>'
    });
    
    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}