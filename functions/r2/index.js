export async function onRequest(context) {
  console.log('=== R2 代理请求开始 ===');
  console.log('完整 URL:', context.request.url);
  
  const url = new URL(context.request.url);
  const path = url.searchParams.get('path');
  
  console.log('查询参数 path:', path);

  if (!path) {
    return new Response(JSON.stringify({
      error: 'Missing path parameter',
      usage: '/r2?path=avatar/xxx.png'
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log('R2 bucket 绑定:', context.env['game-bucket'] ? '已绑定' : '未绑定');
  console.log('所有绑定:', Object.keys(context.env));

  const bucket = context.env['game-bucket'];
  if (!bucket) {
    return new Response(JSON.stringify({ error: 'R2 bucket not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('正在查找 R2 对象:', path);
    const object = await bucket.get(path);

    console.log('R2 对象结果:', object ? '找到' : '未找到');
    if (object) {
      console.log('对象大小:', object.size);
      console.log('对象类型:', object.httpMetadata?.contentType);
    }

    if (!object) {
      return new Response(JSON.stringify({ 
        error: 'Not Found',
        searchedPath: path
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('R2 代理错误:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
