/**
 * routes/manifest.js — mounted at /api/manifest
 *
 * Dynamically generates the TonConnect manifest based on the incoming Host header.
 * Allows seamless tunneling (ngrok, cloudflare) without rebuilding frontend files.
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  
  // Cloudflare tunnels terminate HTTPS and forward to local HTTP
  const isCloudflare = host.includes('trycloudflare.com');
  const finalProtocol = isCloudflare ? 'https' : protocol;

  const url = `${finalProtocol}://${host}`;

  res.json({
    url: url,
    name: "TON-Eats",
    iconUrl: `${url}/ton.svg`,
    termsOfUseUrl: `${url}`,
    privacyPolicyUrl: `${url}`
  });
});

module.exports = router;
