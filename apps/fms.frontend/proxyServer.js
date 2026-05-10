const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');

const proxy = createProxyMiddleware({
  target: 'http://10.0.10.150/comGpsGate/api/v.1/applications/12',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.removeHeader('User-Agent'); // Remove the user-agent header
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*'; // Allow all origins
  }
});

const server = http.createServer((req, res) => {
  proxy(req, res, (err) => {
    if (err) {
      res.writeHead(500);
      res.end('Error connecting to proxy');
    }
  });
});

server.listen(3005, () => {
  console.log('Proxy server running on port 3005');
});
