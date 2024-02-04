await Bun.build({
  entrypoints: ['src/main.tsx'],
  outdir: './build',
});

await Bun.write('build/index.html', Bun.file('public/index.html'));

Bun.serve({
  fetch(req: Request): Response | Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/') {
      return new Response(Bun.file('build/index.html'));
    }

    return new Response(Bun.file('build' + url.pathname));
  },

  // Optional port number - the default value is 3000
  port: process.env.PORT || 3000,
});
