// Password reset email. Tables + inline styles because email clients ignore most modern CSS.
// Colors mirror the site's Lagoon theme (src/styles/theme.css).

const INK = "#061013";
const RAISED = "#0a161a";
const BORDER = "#16292e";
const TEAL = "#5fd9cc";
const TEXT = "#e6f1f0";
const MUTED = "#8fa6a8";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function resetPasswordEmail({ username, link, minutes }: { username: string; link: string; minutes: number }) {
  const subject = "Reset your Mugenkai password";
  const text = `Hi ${username},

Someone (hopefully you) asked to reset the password for your Mugenkai account.
Open this link to choose a new one. It expires in ${minutes} minutes:

${link}

If you didn't ask for this, ignore this email. Your password stays the same.

— Mugenkai`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Choose a new password. This link expires in ${minutes} minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${INK};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td align="center" style="padding-bottom:24px;font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:4px;color:${TEXT};">
            <span style="color:${TEAL};">∞</span>&nbsp;MUGENKAI
          </td>
        </tr>
        <tr>
          <td style="background:${RAISED};border:1px solid ${BORDER};border-radius:16px;padding:40px 32px;font-family:${FONT};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="height:4px;width:48px;background:${TEAL};border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
                <td></td>
              </tr>
            </table>
            <h1 style="margin:24px 0 12px;font-size:24px;line-height:1.3;font-weight:700;color:${TEXT};">Reset your password</h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${MUTED};">Hi <strong style="color:${TEXT};">${username}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:${MUTED};">Someone (hopefully you) asked to reset the password for your Mugenkai account. Choose a new one below. Your watch progress and list stay just as they are.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="${TEAL}" style="border-radius:10px;">
                  <a href="${link}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:${FONT};font-size:15px;font-weight:700;color:${INK};text-decoration:none;border-radius:10px;">Set new password</a>
                </td>
              </tr>
            </table>
            <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">This link expires in <strong style="color:${TEXT};">${minutes} minutes</strong> and works once. Signing in with the new password signs you out everywhere else.</p>
            <hr style="border:none;border-top:1px solid ${BORDER};margin:28px 0;">
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${MUTED};">Button not working? Paste this into your browser:</p>
            <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;"><a href="${link}" target="_blank" style="color:${TEAL};text-decoration:none;">${link}</a></p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 16px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
            Didn't ask for this? Ignore this email. Your password won't change.<br>
            © ${new Date().getFullYear()} Mugenkai
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { subject, html, text };
}
