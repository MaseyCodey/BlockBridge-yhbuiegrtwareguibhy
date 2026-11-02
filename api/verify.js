const normalizeEmail = (value) => value.trim().toLowerCase();
const normalizeText = (value) => value.trim();

function validate(body) {
  const email = normalizeEmail(String(body.email || ""));
  const confirmEmail = normalizeEmail(String(body.confirmEmail || ""));
  const minecraftUsername = normalizeText(String(body.minecraftUsername || ""));
  const confirmMinecraftUsername = normalizeText(String(body.confirmMinecraftUsername || ""));
  const discordUsername = normalizeText(String(body.discordUsername || ""));
  const confirmDiscordUsername = normalizeText(String(body.confirmDiscordUsername || ""));

  if (body.website) return { error: "Unable to process this request." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!/^[A-Za-z0-9_]{3,16}$/.test(minecraftUsername)) return { error: "Enter a valid Minecraft username." };
  if (!/^[A-Za-z0-9._#-]{2,32}$/.test(discordUsername)) return { error: "Enter a valid Discord username." };

  if (
    email !== confirmEmail ||
    minecraftUsername !== confirmMinecraftUsername ||
    discordUsername !== confirmDiscordUsername
  ) {
    return { error: "The confirmation details do not match." };
  }

  if (String(body.consent) !== "on") return { error: "Consent is required." };

  const startedAt = Number(body.startedAt || 0);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 2500) {
    return { error: "Please take a moment to review your details and try again." };
  }

  return { email, minecraftUsername, discordUsername };
}

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.error("DISCORD_WEBHOOK_URL is not configured.");
    return response.status(503).json({ error: "Verification is temporarily unavailable." });
  }

  let body = request.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return response.status(400).json({ error: "Invalid request." });
    }
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return response.status(400).json({ error: "Invalid request." });
  }

  const result = validate(body);
  if (result.error) return response.status(400).json({ error: result.error });

  try {
    const webhookResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "BlockBridge Verification",
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: "New player verification request",
            color: 5168639,
            fields: [
              { name: "Minecraft email", value: result.email, inline: false },
              { name: "Minecraft username", value: result.minecraftUsername, inline: true },
              { name: "Discord username", value: result.discordUsername, inline: true },
            ],
            footer: {
              text: "Manual review required · Never request passwords or security codes",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!webhookResponse.ok) {
      console.error("Discord webhook failed", webhookResponse.status);
      return response.status(502).json({
        error: "The moderation channel could not be reached. Please try again later.",
      });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Discord webhook request failed", error);
    return response.status(502).json({
      error: "The moderation channel could not be reached. Please try again later.",
    });
  }
};
