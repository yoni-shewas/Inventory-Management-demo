import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const curlFetch = (url: string, options: any = {}) => {
  const method = options.method || "GET";
  const headers = options.headers || {};
  const body = options.body;

  let curlCmd = `curl -i -s -w "\\nHTTP_STATUS_CODE:%{http_code}" -X ${method}`;
  
  let headerEntries: [string, any][] = [];
  if (headers && typeof headers.forEach === "function") {
    headers.forEach((val: any, key: any) => {
      headerEntries.push([key, val]);
    });
  } else if (headers && typeof headers === "object") {
    headerEntries = Object.entries(headers);
  }

  for (const [key, val] of headerEntries) {
    curlCmd += ` -H "${key}: ${String(val).replace(/"/g, '\\"')}"`;
  }
  if (body) {
    const escapedBody = typeof body === "string" ? body.replace(/'/g, "'\\''") : String(body).replace(/'/g, "'\\''");
    curlCmd += ` -d '${escapedBody}'`;
  }
  curlCmd += ` "${url}"`;

  try {
    const stdout = execSync(curlCmd);
    const delimiter = Buffer.from("\nHTTP_STATUS_CODE:");
    const delimIndex = stdout.lastIndexOf(delimiter);
    let statusCode = 200;
    let rawContent = stdout;
    if (delimIndex !== -1) {
      statusCode = parseInt(stdout.subarray(delimIndex + delimiter.length).toString().trim(), 10);
      rawContent = stdout.subarray(0, delimIndex);
    }
    const ok = statusCode >= 200 && statusCode < 300;

    const headerEndIndex = rawContent.indexOf(Buffer.from("\r\n\r\n"));
    let headerText = "";
    let bodyBuffer = rawContent;
    if (headerEndIndex !== -1) {
      headerText = rawContent.subarray(0, headerEndIndex).toString("utf8");
      bodyBuffer = rawContent.subarray(headerEndIndex + 4);
    } else {
      const lfEndIndex = rawContent.indexOf(Buffer.from("\n\n"));
      if (lfEndIndex !== -1) {
        headerText = rawContent.subarray(0, lfEndIndex).toString("utf8");
        bodyBuffer = rawContent.subarray(lfEndIndex + 2);
      }
    }

    const responseHeaders = new Map<string, string>();
    headerText.split(/\r?\n/).forEach((line) => {
      const parts = line.split(":");
      if (parts.length > 1) {
        const key = parts[0].trim().toLowerCase();
        const val = parts.slice(1).join(":").trim();
        responseHeaders.set(key, val);
      }
    });

    return Promise.resolve({
      ok,
      status: statusCode,
      headers: {
        get: (name: string) => responseHeaders.get(name.toLowerCase()) || null,
      },
      json: () => Promise.resolve(JSON.parse(bodyBuffer.toString("utf8"))),
      text: () => Promise.resolve(bodyBuffer.toString("utf8")),
      arrayBuffer: () => Promise.resolve(bodyBuffer.buffer.slice(bodyBuffer.byteOffset, bodyBuffer.byteOffset + bodyBuffer.byteLength)),
      buffer: () => Promise.resolve(bodyBuffer),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(bodyBuffer));
          controller.close();
        }
      }),
    } as any);
  } catch (err) {
    return Promise.reject(err);
  }
};

if (typeof window === "undefined") {
  globalThis.fetch = curlFetch as any;
}

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl || dbUrl === "your_connection_string") {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const match = envContent.match(/^DATABASE_URL=["']?(.*?)["']?$/m);
      if (match && match[1] && match[1] !== "your_connection_string") {
        dbUrl = match[1];
      }
    }
  } catch (e) {
    // Ignore error
  }
}

if (!dbUrl || dbUrl === "your_connection_string") {
  dbUrl = "postgres://localhost:5432/inventory_demo";
}

const sql = neon(dbUrl);

export const db = drizzle(sql);
