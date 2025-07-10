const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
require("dotenv").config();

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const API_KEY = process.env.FRESHDESK_API_KEY;

app.post("/webhook", async (req, res) => {
  const { subject, description, to_email } = req.body;

  // Combine fields to extract all emails, including 'to_email'
  const textToScan = [subject, description, to_email].filter(Boolean).join(" ");
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const emails = [...new Set(textToScan.match(emailRegex))];

  if (!emails.length) {
    console.log("No emails found in payload:", req.body);
    return res.status(400).send("No valid emails found.");
  }

  console.log("Creating tickets for:", emails);

  const promises = emails.map((email) =>
    axios.post(
      `https://${FRESHDESK_DOMAIN}/api/v2/tickets`,
      {
        email,
        subject: `New ticket for ${email}: ${subject}`,
        description: `Auto-created ticket from original: ${description}`,
      },
      {
        auth: {
          username: API_KEY,
          password: "X", // Any dummy password
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
    console.error("Error from Freshdesk:", err.response?.data || err.message);
    res.status(500).send("Failed to create tickets");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
