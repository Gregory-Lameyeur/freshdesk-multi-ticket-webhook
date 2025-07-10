const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
require("dotenv").config();

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const API_KEY = process.env.FRESHDESK_API_KEY;

app.post("/webhook", async (req, res) => {
  const { to_email, subject, description } = req.body;

  // Split emails by comma, trim spaces, and remove duplicates
  const emails = [...new Set(to_email.split(",").map((e) => e.trim()))];

  console.log("Creating tickets for:", emails);

  const promises = emails.map((email) =>
    axios.post(
      `https://${FRESHDESK_DOMAIN}/api/v2/tickets`,
      {
        email,
        subject: `New ticket for ${email}: ${subject}`,
        description: `Auto-created ticket from original: ${description}`,
        status: 2,
        priority: 1,
        custom_fields: {
          cf_branch: "Leevin Dublin", // or "Leevin Cork"
        },
      },
      {
        auth: {
          username: API_KEY,
          password: "X", // Dummy password
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  );

  try {
    await Promise.all(promises);
    res.status(200).send("Tickets created");
  } catch (err) {
    console.error(
      "❌ Error from Freshdesk:",
      err.response?.data || err.message
    );
    res.status(500).send("Failed to create tickets");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
