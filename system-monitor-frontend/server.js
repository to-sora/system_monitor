const https = require('https');
const fs = require('fs');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Load self-signed certificate and key
const httpsOptions = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.cert'),
};

app.prepare().then(() => {
  const PORT = process.env.PORT || 3001;
  https.createServer(httpsOptions, (req, res) => {
    handle(req, res);
  }).listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Server listening on https://0.0.0.0:${PORT}`);
  });
});
