export async function onRequest(context) {
  const url = new URL(context.request.url);
  const searchParams = url.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return new Response('Missing path parameter', { status: 400 });
  }

  console.log('R2 请求路径:', path);

  const bucket = context.env['game-bucket'];
  if (!bucket) {
    console.error('R2 bucket 未配置');
    return new Response('R2 bucket not configured', { status: 500 });
  }

  try {
    const object = await bucket.get(path);

    console.log('R2 对象查找结果:', object ? '找到' : '未找到');

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
