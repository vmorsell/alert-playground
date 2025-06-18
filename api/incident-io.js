export default async function handler(req, res) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://alert-playground.vercel.app',
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const fullPath = requestUrl.pathname;

    // only one expected path really, since we only publish alerts
    const allowedPaths = ['v2/alert_events/http/'];

    const apiPath = fullPath.replace('/api/incident-io/', '');

    if (!apiPath || !allowedPaths.some((path) => apiPath.startsWith(path))) {
      return res.status(403).json({
        error: 'Forbidden API path',
        path: apiPath,
      });
    }

    // validate auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid authorization header' });
    }

    const targetUrl = `https://api.incident.io/${apiPath}`;

    const forwardHeaders = {
      'User-Agent': 'Alert-Playground-Proxy/1.0',
      Authorization: authHeader,
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    let requestBody;
    if (req.body) {
      requestBody =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      // body should not be too large
      if (requestBody.length > 1000) {
        // 1kB
        return res.status(413).json({ error: 'Request body too large' });
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: forwardHeaders,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.text();
      res.status(response.status);

      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch {
        res.send(data);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return res.status(408).json({ error: 'Request timeout' });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}
