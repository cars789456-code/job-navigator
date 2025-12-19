import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string[];
  subject: string;
  message: string;
  jobTitle: string;
  companyName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message, jobTitle, companyName }: EmailRequest = await req.json();

    console.log("Sending email to:", to);

    const emailPromises = to.map((email) =>
      resend.emails.send({
        from: companyName 
          ? `${companyName} <onboarding@resend.dev>` 
          : "Vagas <onboarding@resend.dev>",
        to: [email],
        subject: subject || `Atualização sobre a vaga: ${jobTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                    ${jobTitle}
                  </h1>
                  ${companyName ? `<p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${companyName}</p>` : ''}
                </div>
                <div style="padding: 32px;">
                  <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">
                    ${message}
                  </p>
                </div>
                <div style="background-color: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    Esta mensagem foi enviada através da plataforma de vagas.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      })
    );

    const results = await Promise.all(emailPromises);
    console.log("Emails sent successfully:", results);

    return new Response(
      JSON.stringify({ success: true, sent: to.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
