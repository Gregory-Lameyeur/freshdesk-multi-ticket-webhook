const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
require("dotenv").config();

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const API_KEY = process.env.FRESHDESK_API_KEY;

app.post("/webhook", async (req, res) => {
  const ticket = req.body.ticket;

  if (!ticket) {
    console.error("No ticket object in payload");
    return res.status(400).send("Bad Request: no ticket in body");
  }

  const toEmails = ticket.to_emails || [];

  if (toEmails.length === 0) {
    console.log("No 'to_emails' found in the ticket");
    return res.status(200).send("No To emails to process");
  }

  console.log("Creating tickets for:", toEmails);

  try {
    const promises = toEmails.map((email) =>
      axios.post(
        `https://${FRESHDESK_DOMAIN}/api/v2/tickets`,
        {
          email,
          subject: `New ticket for ${email}: ${ticket.subject}`,
          description: `Auto-created ticket from original: ${ticket.description}`,
          status: 2, // Open
          priority: 1, // Low
          // Include any custom fields if needed:
          // custom_fields: { cf_branch: "Leevin Dublin" }
        },
        {
          auth: {
            username: API_KEY,
            password: "X", // dummy password as per Freshdesk API auth
          },
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await Promise.all(promises);
    res.status(200).send("Tickets created successfully");
  } catch (err) {
    console.error("Error creating tickets:", err.response?.data || err.message);
    res.status(500).send("Failed to create tickets");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
