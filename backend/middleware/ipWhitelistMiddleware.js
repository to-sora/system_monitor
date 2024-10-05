// middleware/ipWhitelistMiddleware.js
const yaml = require('yamljs');
const config = yaml.load('./config/config.yaml');

const ipWhitelist = (req, res, next) => {
  const allowedIPs = config.apiSecurity.allowedIPs;
  const requestIP = req.ip || req.connection.remoteAddress;
  console.log('Request IP:', requestIP);
  console.log('Allowed IPs:', allowedIPs);

  // Handle cases where IP might be in IPv6 format
  const normalizedIP = requestIP.includes('::ffff:') ? requestIP.split('::ffff:')[1] : requestIP;

  if (allowedIPs.includes(normalizedIP)) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied from this IP address.' });
  }
};

module.exports = ipWhitelist;
