
import { createServer } from 'node:http';
import axios from 'axios';

const PORT = +process.env.PORT || 3000;

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

const setHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
};

const server = createServer(async (req, res) => {
  try {
    setHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    console.log(`url: ${req.url}`);
    console.log(`method: ${req.method}`);

    const service = req.url.split(/\/|\?/)[1];
    const serviceUrl = process.env[service.toUpperCase()];
    if (!serviceUrl) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Cannot process request' }));
      return;
    }
    const body = await getBody(req);
    console.log(`body: ${body}`);
    const response = await axios({
      method: req.method,
      url: serviceUrl + req.url,
      headers: {
        Authorization: req.headers.authorization,
      },
      data: body ? JSON.parse(body) : undefined,
    }).catch((error) => {
      let status = 500;
      let data = { error: error.message };
      if (error.response) {
        status = error.response.status;
        data = error.response.data;
      }
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    });

    if (!response) {
      return;
    }

    const { status, data, headers } = response;
    const contentType = headers['content-type'] || 'application/json';
    res.writeHead(status, { 'Content-Type': contentType });
    if (contentType.includes('application/json')) {
      res.end(JSON.stringify(data));
    } else {
      res.end(data);
    }
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`BFF Service is running at http://localhost:${PORT}`);
});