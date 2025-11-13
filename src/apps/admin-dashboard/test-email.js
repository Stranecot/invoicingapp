// Quick test script to verify Resend API is working
const { Resend } = require('resend');

const resend = new Resend('re_EZTh67tX_9HtGuuo795yfzAkZXdtPRQRE');

async function testEmail() {
  console.log('Testing Resend API...');
  console.log('API Key:', 're_EZTh67tX_9HtGuuo795yfzAkZXdtPRQRE');
  console.log('Sending test email...\n');

  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'radevstefan771@gmail.com',
      subject: 'Test Email from Invoice App Admin',
      html: '<p>This is a <strong>test email</strong> from the admin dashboard!</p>',
      text: 'This is a test email from the admin dashboard!',
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', data.id);
    console.log('\nCheck your inbox at radevstefan771@gmail.com');
  } catch (error) {
    console.error('❌ Exception occurred:', error.message);
  }
}

testEmail();
