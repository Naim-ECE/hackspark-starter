FROM node:20-alpine
WORKDIR /app

RUN npm init -y && npm install express

RUN cat > server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8004;

app.use(express.json());

app.get('/status', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(501).json({ error: 'Service not implemented' });
});

app.listen(PORT, () => {
  console.log(`Agentic Service listening on port ${PORT}`);
});
EOF

EXPOSE 8004
HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD node -e "require('http').get('http://localhost:8004/status', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["node", "server.js"]