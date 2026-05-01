FROM node:20-alpine
WORKDIR /app

RUN npm init -y && npm install express

RUN cat > server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8003;

app.use(express.json());

app.get('/status', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(501).json({ error: 'Service not implemented' });
});

app.listen(PORT, () => {
  console.log(`Analytics Service listening on port ${PORT}`);
});
EOF

EXPOSE 8003
HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD node -e "require('http').get('http://localhost:8003/status', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["node", "server.js"]