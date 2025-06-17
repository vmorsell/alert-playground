export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract the path segments after /api/incident-io/
    const { path: pathSegments } = req.query;
    
    console.log('Path segments:', pathSegments);
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    
    if (!pathSegments) {
      return res.status(400).json({ error: 'No path provided' });
    }
    
    const apiPath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
    const targetUrl = `https://api.incident.io/${apiPath}`;
    
    console.log('Target URL:', targetUrl);
    
    const forwardHeaders = {
      'User-Agent': 'Alert-Playground-Proxy/1.0',
    };
    
    if (req.headers.authorization) {
      forwardHeaders['Authorization'] = req.headers.authorization;
    }
    
    if (req.method !== 'GET' && req.headers['content-type']) {
      forwardHeaders['Content-Type'] = req.headers['content-type'];
    }
    
    let requestBody;
    if (req.method !== 'GET' && req.body) {
      requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }
    
    console.log('Request body:', requestBody);
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: requestBody,
    });

    console.log('Incident.io response status:', response.status);
    
    const data = await response.text();
    console.log('Incident.io response body:', data);
    
    res.status(response.status);
    
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      res.send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message,
      stack: error.stack
    });
  }
} 