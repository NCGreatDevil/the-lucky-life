export async function onRequest(context) {
  return new Response(JSON.stringify({
    message: 'R2 proxy is working',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
