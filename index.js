app.post("/webhook", async (req, res) => {
  const { to_email, subject, description } = req.body;

  if (!to_email) {
    return res.status(400).send("Missing to_email in request body");
  }

  try {
    await axios.post(
      `https://${FRESHDESK_DOMAIN}/api/v2/tickets`,
      {
        email: to_email,
        subject: `New ticket for ${to_email}: ${subject}`,
        description: `Auto-created ticket from original: ${description}`,
      },
      {
        auth: {
          username: API_KEY,
          password: "X",
        },
        headers: { "Content-Type": "application/json" },
      }
    );
    res.status(200).send("Ticket created");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to create ticket");
  }
});
