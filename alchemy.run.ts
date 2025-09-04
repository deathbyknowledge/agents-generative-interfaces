import alchemy from "alchemy";
import {
  DurableObjectNamespace,
  Worker,
  R2Bucket,
  KVNamespace,
} from "alchemy/cloudflare";

const NAME = "storagemcp";

const app = await alchemy(NAME);

export const worker = await Worker(NAME, {
  name: NAME,
  entrypoint: "index.ts",
  bindings: {
    MCP_OBJECT: DurableObjectNamespace(`${NAME}-agent`, {
      className: "StorageMcp",
      sqlite: true,
    }),
    OAUTH_KV: await KVNamespace("oauth-kv", {
      title: `${NAME}-oauth-kv`,
    }),
    BUCKET: await R2Bucket(`${NAME}-bucket`),
    SHARED_PASSWORD: "1234",
  },
  url: true,
  compatibilityFlags: ["nodejs_compat"],
  bundle: {
    metafile: true,
    format: "esm",
    target: "es2020",
  },
});

console.log(worker.url);

await app.finalize();
