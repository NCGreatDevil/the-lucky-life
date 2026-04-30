export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.searchParams.get('path');

  if (!path) {
    return new Response('Missing path parameter', { status: 400 });
  }

  const bucket = context.env['game-bucket'];
  if (!bucket) {
    return new Response('R2 bucket not configured', { status: 500 });
  }

  try {
    const object = await bucket.get(path);

    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('R2 代理错误:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
