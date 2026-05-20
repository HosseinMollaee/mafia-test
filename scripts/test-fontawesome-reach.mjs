/**
 * Build-time probe: can this environment reach Font Awesome's npm registry over HTTPS?
 * If this succeeds but public npm registry fails, outbound HTTPS may be allowlisted
 * only for specific hosts (e.g. npm.fontawesome.com).
 */
const url = "https://npm.fontawesome.com/";

try {
  const r = await fetch(url, { method: "HEAD" });
  console.log(`FA registry reachable: ${r.status} (${url})`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.log(`FA registry reachable: no (${msg})`);
}
