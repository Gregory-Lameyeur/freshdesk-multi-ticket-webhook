const express = require("express");
const axios = require("axios");
const app = express();
require("dotenv").config();

app.use(express.json());

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const API_KEY = process.env.FRESHDESK_API_KEY;

app.post("/webhook", async (req, res) => {
  const { subject, description, to_email } = req.body;

  // Handle string or array format for to_email
  let emails = [];

  if (typeof to_email === "string") {
    emails = to_email.split(",").map((e) => e.trim());
  } else if (Array.isArray(to_email)) {
    emails = to_email.map((e) => e.trim());
  }

  // Remove duplicates and filter valid emails
  emails = [...new Set(emails)].filter((e) => e.includes("@"));

  if (!emails.length) {
    console.log("❌ No valid 'to_email' addresses found:", req.body);
    return res.status(400).send("No valid to_email found.");
  }

  console.log("📨 Creating tickets for:", emails);

  const promises = emails.map((email) =>
    axios.post(
      `https://${FRESHDESK_DOMAIN}/api/v2/tickets`,
      {
        email,
        subject: `New ticket for ${email}: ${subject}`,
        description: `Auto-created ticket based on original email.`,
        status: 2, // Open
        priority: 1, // Low
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
app.listen(PORT, () =>
  console.log(`🚀 Webhook server running on port ${PORT}`)
);
