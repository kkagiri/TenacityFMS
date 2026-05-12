const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const normalizeTarget = (target) => {
    if (!target) {
      return 'http://localhost:2008';
    }

    return target.replace(/\/api\/?$/i, '');
  };

  const proxyTarget = normalizeTarget(process.env.REACT_APP_PROXY_TARGET);

  const buildOptions = (overrides = {}) => {
    const { silentErrors = false, ...rest } = overrides;
    return {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
      logLevel: silentErrors ? 'warn' : 'debug',
      on: {
        error: (err, req, res) => {
          if (silentErrors) {
            // SignalR hub reconnect attempts produce noisy ECONNRESET / aborted entries
            // before login or during logout. Swallow them in dev.
            return;
          }
          console.error(`[proxy] error ${req.method} ${req.url} -> ${proxyTarget}: ${err.message}`);
          if (res && !res.headersSent) {
            try {
              res.writeHead(502, { 'Content-Type': 'text/plain' });
              res.end('Proxy error: backend is not reachable');
            } catch (_) {
              /* ignore */
            }
          }
        },
        proxyReq: (proxyReq, req) => {
          if (silentErrors) return;
          console.log(`[proxy] ${req.method} ${req.url} -> ${proxyTarget}${proxyReq.path}`);
        },
        proxyRes: (proxyRes, req) => {
          if (silentErrors) return;
          console.log(`[proxy] ${proxyRes.statusCode} <- ${req.method} ${req.url}`);
        }
      },
      ...rest
    };
  };

  // Modern path: /api/v1/... → backend /api/v1/... (re-add stripped /api prefix)
  app.use(
    '/api',
    createProxyMiddleware(buildOptions({ pathRewrite: (path) => '/api' + path }))
  );

  // Legacy path: /v1/... → backend /api/v1/... (re-add /api prefix on stripped /v1)
  app.use(
    '/v1',
    createProxyMiddleware(buildOptions({ pathRewrite: (path) => '/api/v1' + path }))
  );

  // SignalR hubs (root paths, require WebSocket support)
  // silentErrors=true: hub reconnects naturally produce ECONNRESET noise; only log fatal issues.
  const hubPaths = ['/dashboardHub', '/ptsHub', '/frontendHub', '/vehicleTrackingHub'];
  hubPaths.forEach((hubPath) => {
    const hubPathLower = hubPath.toLowerCase();

    app.use(
      hubPath,
      createProxyMiddleware(
        buildOptions({
          ws: true,
          silentErrors: true,
          pathRewrite: (path) => {
            if (path.toLowerCase().startsWith(hubPathLower)) {
              return path;
            }

            return hubPath + path;
          }
        })
      )
    );
  });
};
