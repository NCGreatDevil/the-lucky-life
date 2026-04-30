export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.replace('/r2/', '');

  if (!pathname) {
    return new Response('Not Found', { status: 404 });
  }

  const bucket = context.env['game-bucket'];
  if (!bucket) {
    return new Response('R2 bucket not configured', { status: 500 });
  }

  try {
    const object = await bucket.get(pathname);

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
