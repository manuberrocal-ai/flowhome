type DenoRuntime = {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const runtime = (globalThis as typeof globalThis & { Deno?: DenoRuntime }).Deno;

export function environment(name: string) {
  return runtime?.env.get(name);
}

export function serve(handler: (request: Request) => Response | Promise<Response>) {
  if (!runtime) throw new Error('Deno Edge runtime is unavailable.');
  runtime.serve(handler);
}
