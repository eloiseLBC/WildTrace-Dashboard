// Only the API URL is exposed to the browser; OCI credentials remain on the server.
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "")).replace(/\/$/, "");
export async function loadDashboard({ signal, from, to, locationId } = {}) {
  let response;
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  if (locationId) query.set("locationId", locationId);
  try { response = await fetch(baseUrl + "/api/dashboard" + (query.size ? "?" + query : ""), { signal }); }
  catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Cannot reach the WildTrace API. Check that the server is running.");
  }
  if (!response.ok) throw new Error("Unable to load OCI data (HTTP " + response.status + ").");
  let result;
  try { result = await response.json(); } catch { throw new Error("The API did not return JSON. Check the API URL or proxy."); }
  if (!result.data || !Array.isArray(result.data.environmental) || !Array.isArray(result.data.biological)
    || !Array.isArray(result.data.locations)) throw new Error("Unexpected Dashboard API response.");
  return result;
}
export const dashboardLoaders = { loadDashboard };
