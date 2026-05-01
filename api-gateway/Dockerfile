FROM node:20-alpine
WORKDIR /app

# Create a minimal Express server for the gateway
RUN npm init -y && npm install express cors

RUN cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());

app.get('/status', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(501).json({ error: 'Service not implemented' });
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
EOF

EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD node -e "require('http').get('http://localhost:8000/status', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["node", "server.js"]