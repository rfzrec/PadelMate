require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Deteksi lokasi folder frontend
const containerFrontendPath = "/frontend";
const relativeFrontendPath = path.join(__dirname, "..", "frontend");

const frontendPath = fs.existsSync(containerFrontendPath)
  ? containerFrontendPath
  : relativeFrontendPath;

app.use(cors());

// Opsi proxy terpusat.
// PENTING: gunakan `pathFilter` (bukan mount path di app.use) supaya path asli
// seperti /api/auth/register tetap utuh saat diteruskan ke service.
// Jika memakai app.use("/api/auth", proxy), http-proxy-middleware v3 akan
// memotong prefix sehingga service menerima "/register" -> 404.
const proxyTo = (pathFilter, target) =>
  createProxyMiddleware({
    target,
    pathFilter,
    changeOrigin: true,
    proxyTimeout: 15000,
    timeout: 20000,
    on: {
      error: (err, req, res) => {
        console.error(`[Proxy Error] ${req.originalUrl} gagal:`, err.message);
        if (res && typeof res.writeHead === "function" && !res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: "Gateway Error: Service tujuan tidak dapat dijangkau.",
              error: err.message
            })
          );
        }
      }
    }
  });

// 1. Proxy Route API ke Microservices
app.use(proxyTo("/api/auth", process.env.AUTH_SERVICE_URL || "http://auth-service:3004"));
app.use(proxyTo("/api/courts", process.env.COURT_SERVICE_URL || "http://court-service:3001"));
app.use(proxyTo("/api/bookings", process.env.BOOKING_SERVICE_URL || "http://booking-service:3002"));
app.use(proxyTo("/api/matches", process.env.MATCH_SERVICE_URL || "http://match-service:3003"));

// 2. Health Check Gateway
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", gateway: "running", frontendPath });
});

// 3. Serve Static Frontend Files
app.use(express.static(frontendPath));

// 4. Fallback Handler (Aman untuk Express v4 & v5)
app.use((req, res) => {
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ message: "API Endpoint tidak ditemukan." });
  }

  const requestedFile = path.join(frontendPath, req.path);
  
  if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    return res.sendFile(requestedFile);
  }

  const indexFile = path.join(frontendPath, "index.html");
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  res.status(404).send("File atau halaman tidak ditemukan.");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
  console.log(`Frontend served from: ${frontendPath}`);
});