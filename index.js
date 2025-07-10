const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
require("dotenv").config();

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const API_KEY = process.env.FRESHDESK_API_KEY;

app.post("/webhook", async (req, res) => {
  const { subject, description } = req.body;

  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const emails = [...new Set((subject + " " + description).match(emailRegex))]; // Remove duplicates

  const promises = emails.map((email) =>
    axios.post(
      `https://${FRESHDESK_DOMAIN}/api/v2/tickets`,
      {
        email: to_email,
        subject: `New ticket for ${to_email}: ${subject}`,
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
    console.log("Creating tickets for:", emails);
    await Promise.all(promises);
    res.status(200).send("Tickets created");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to create tickets");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
