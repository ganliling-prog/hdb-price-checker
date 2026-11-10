import type { Request, Response } from 'express';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  dataGovSg: {
    endpoint: string;
    resourceId: string;
    hasCustomApiKey: boolean;
    connection: 'reachable' | 'unreachable' | 'unknown';
    latencyMs?: number;
  };
}

/**
 * Serverless / Express health check handler
 * GET /api/health
 */
export default async function handler(req: Request, res: Response) {
  const startTime = Date.now();
  const resourceId = process.env.HDB_RESOURCE_ID || 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
  const apiKey = process.env.DATA_GOV_SG_API_KEY || process.env.DATA_GOV_API_KEY || '';

  let connectionStatus: 'reachable' | 'unreachable' | 'unknown' = 'unknown';
  let latencyMs: number | undefined;

  // Lightweight probe to verify data.gov.sg endpoint availability
  try {
    const probeUrl = `https://data.gov.sg/api/action/datastore_search?resource_id=${resourceId}&limit=1`;
    const headers: Record<string, string> = {
      'User-Agent': 'HDB-Resale-Valuation-App/1.0',
    };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const probeRes = await fetch(probeUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    latencyMs = Date.now() - startTime;
    connectionStatus = probeRes.ok ? 'reachable' : 'unreachable';
  } catch (err) {
    connectionStatus = 'unreachable';
    latencyMs = Date.now() - startTime;
  }

  const payload: HealthCheckResponse = {
    status: connectionStatus === 'reachable' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: process.env.NODE_ENV || 'development',
    dataGovSg: {
      endpoint: 'https://data.gov.sg/api/action/datastore_search',
      resourceId,
      hasCustomApiKey: Boolean(apiKey),
      connection: connectionStatus,
      latencyMs,
    },
  };

  const statusCode = payload.status === 'ok' ? 200 : 503;
  return res.status(statusCode).json(payload);
}
