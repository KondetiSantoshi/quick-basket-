import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import connectDB from '../config/db.js';
import { createExpressApp } from './expressApp.js';

let expressAppInstance = null;

function getExpressApp() {
  if (!expressAppInstance) {
    expressAppInstance = createExpressApp();
  }
  return expressAppInstance;
}

export async function handleApiRequest(request) {
  try {
    await connectDB();
    const app = getExpressApp();

    const urlObj = new URL(request.url);
    const url = urlObj.pathname + urlObj.search;
    const method = request.method;

    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text();
    }

    const headers = {};
    request.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    if (body) {
      headers['content-length'] = Buffer.byteLength(body).toString();
      if (!headers['content-type']) {
        headers['content-type'] = 'application/json';
      }
    }

    return await new Promise((resolve) => {
      const req = new Readable({ read() {} });
      req.url = url;
      req.method = method;
      req.headers = headers;

      const resHeaders = {};
      let statusCode = 200;
      const chunks = [];

      const res = {
        setHeader(k, v) {
          resHeaders[k.toLowerCase()] = v;
        },
        getHeader(k) {
          return resHeaders[k.toLowerCase()];
        },
        writeHead(code, h) {
          statusCode = code;
          if (h) Object.assign(resHeaders, h);
        },
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          this.setHeader('content-type', 'application/json');
          this.end(JSON.stringify(data));
        },
        send(data) {
          if (typeof data === 'object') return this.json(data);
          this.end(data);
        },
        end(chunk) {
          if (chunk) chunks.push(Buffer.from(chunk));
          const bodyBuf = Buffer.concat(chunks);
          resolve(
            new NextResponse(bodyBuf, {
              status: statusCode,
              headers: resHeaders
            })
          );
        }
      };

      if (body) {
        req.push(body);
      }
      req.push(null);

      app(req, res);
    });
  } catch (error) {
    console.error('API Bridge Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
