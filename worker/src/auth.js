export function validateAuth(request, env) {
  if (env.SKIP_AUTH === 'true') return true;
  const provided = request.headers.get('X-App-Auth');
  return provided === env.SHARED_PASSPHRASE;
}
