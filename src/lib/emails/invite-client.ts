export function buildInviteEmail(inviteUrl: string): { subject: string; html: string } {
  const subject = 'Welkom bij Oeyen Coaching — stel je account in'

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F2F2F2;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F2;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <div style="font-size:18px;font-weight:800;letter-spacing:4px;color:#111;">OEYEN</div>
              <div style="font-size:9px;letter-spacing:6px;color:#999;margin-top:3px;">COACHING</div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#fff;border:1px solid #E0E0E0;border-radius:16px;padding:40px 40px 36px;">

              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1.5px;">Welkom</p>
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#111;line-height:1.3;">
                Je intake is ontvangen!
              </h1>

              <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.65;">
                Bedankt voor het invullen van de intake. Ik heb alles goed ontvangen en kijk ernaar uit om samen aan de slag te gaan.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#444;line-height:1.65;">
                Klik op de knop hieronder om je wachtwoord in te stellen en toegang te krijgen tot je persoonlijk coaching portaal.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}"
                       style="display:inline-block;background:#111;color:#fff;font-size:14px;font-weight:700;
                              letter-spacing:0.5px;text-decoration:none;border-radius:10px;
                              padding:14px 36px;">
                      Account instellen →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #EBEBEB;margin:36px 0;" />

              <!-- What's inside -->
              <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1.2px;">Wat vind je in het portaal?</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">📋&nbsp; Jouw persoonlijk voedingsschema</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">🏋️&nbsp; Trainingsschema's op maat</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">📊&nbsp; Dagelijkse logs & check-ins</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">📈&nbsp; Voortgang & metingen</td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #EBEBEB;margin:32px 0 24px;" />

              <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
                Vragen? Stuur me gerust een berichtje.<br/>
                <strong style="color:#555;">Dimitri Oeyen</strong> — Oeyen Coaching
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:#BBB;line-height:1.6;">
                Deze link is 24 uur geldig en kan slechts één keer gebruikt worden.<br/>
                Je ontvangt deze e-mail omdat je een intake hebt ingevuld bij Oeyen Coaching.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}
