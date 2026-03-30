import { Router, type IRouter, type Request, type Response } from "express";
import https from "https";
import { URL } from "url";

const router: IRouter = Router();

const UPSTREAM_BASE = "https://dev.natureland.hipster-virtual.com/api/v1";

function proxyRequest(req: Request, res: Response) {
  const upstreamPath = req.url;
  const targetHref = UPSTREAM_BASE + upstreamPath;
  let targetUrl: URL;

  try {
    targetUrl = new URL(targetHref);
  } catch (e) {
    req.log?.error({ href: targetHref }, "Invalid upstream URL");
    res.status(502).json({ error: "Bad Gateway", message: "Invalid upstream URL" });
    return;
  }

  const options: https.RequestOptions = {
    hostname: targetUrl.hostname,
    port: 443,
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: {
      "content-type": "application/json",
      "accept": "application/json",
    },
  };

  const authHeader = req.headers["authorization"];
  if (authHeader) {
    options.headers!["authorization"] = authHeader;
  }

  req.log?.debug({ target: targetUrl.href, method: req.method }, "Proxying upstream");

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode || 200);
    res.setHeader("content-type", proxyRes.headers["content-type"] || "application/json");

    const chunks: Buffer[] = [];
    proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
    proxyRes.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      try {
        const parsed = JSON.parse(body);
        res.json(parsed);
      } catch {
        res.send(body);
      }
    });
  });

  proxyReq.on("error", (err) => {
    req.log?.error({ err }, "Proxy request error");
    if (!res.headersSent) {
      res.status(502).json({ error: "Bad Gateway", message: err.message });
    }
  });

  if (req.body && Object.keys(req.body as object).length > 0) {
    const bodyStr = JSON.stringify(req.body);
    proxyReq.setHeader("content-length", Buffer.byteLength(bodyStr));
    proxyReq.write(bodyStr);
  }

  proxyReq.end();
}

router.all("/*path", proxyRequest);

export default router;
