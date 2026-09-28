// Minimal client for Upstash Redis over its REST API (what Vercel's
// "Upstash for Redis" / KV integration provisions). Uses global fetch, so it
// adds no dependencies.

const config = () => {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
};

const createRedis = ({ url, token }) => {
    const send = async (endpoint, commands) => {
        const res = await fetch(`${url}/${endpoint}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(commands)
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(body)) {
            throw new Error(`[redis] ${endpoint} failed (${res.status}): ${body && body.error ? body.error : 'bad response'}`);
        }
        return body.map((r) => {
            if (r.error) throw new Error(`[redis] ${r.error}`);
            return r.result;
        });
    };
    return {
        // Several commands in one round trip.
        pipeline: (commands) => send('pipeline', commands),
        // Several commands applied atomically (MULTI/EXEC).
        transaction: (commands) => send('multi-exec', commands)
    };
};

module.exports = { redisConfig: config, createRedis };
