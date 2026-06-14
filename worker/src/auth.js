export function validateAuth(request, env) {
  const provided = request.headers.get('X-App-Auth');
  return provided === env.SHARED_PASSPHRASE;
}
