// Central API base URL.
// When NEXT_PUBLIC_API_URL is not set, relative URLs (/api/...) are used,
// which lets nginx proxy them to FastAPI on the same host.
// For local dev, set NEXT_PUBLIC_API_URL=http://localhost:8000 in .env.local
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export default API_BASE_URL;
