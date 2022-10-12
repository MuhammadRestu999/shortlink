let nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.email,
    pass: process.env.token
  }
});

async function sendEmail(to, subject, content) {
  if(!to) return false;
  if(!content) return false;

  let mailOptions = {
    from: transporter.options.auth.user,
    to,
    subject,
    text: "",
    html: content
  };
  let res = await transporter.sendMail(mailOptions);

  return res;
}

module.exports = sendEmail;
