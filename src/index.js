export default {
  async scheduled(event, env, ctx) {},

  async fetch(request, env, ctx) {
    return new Response('not found', { status: 404 })
  }
}
