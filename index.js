const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 10000;
const TARGET_HOST = 'generativelanguage.googleapis.com';

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Remove headers that might interfere with routing/chunking
  const incomingHeaders = { ...req.headers };
  delete incomingHeaders['host'];
  delete incomingHeaders['connection'];

  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: {
      ...incomingHeaders,
      'host': TARGET_HOST
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Proxy connection error', details: err.message } }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
