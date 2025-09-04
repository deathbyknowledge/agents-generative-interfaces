import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { z } from "zod";
import { env } from "cloudflare:workers";

export class StorageMcp extends McpAgent {
  server = new McpServer({ name: "", version: "v1.0.0" });

  async init() {
    // Helper to return text responses from our tools
    const textRes = (text: string) => ({
      content: [
        {
          type: "text" as const,
          text,
        },
      ],
    });

    this.server.tool(
      "writeFile",
      "Store text as a file with the given path",
      {
        path: z.string().describe("Absolute path of the file"),
        content: z.string().describe("The content to store"),
      },
      async ({ path, content }) => {
        try {
          await env.BUCKET.put(path, content);
          return textRes(`Successfully stored contents to ${path}`);
        } catch (e: unknown) {
          return textRes(`Couldn't save to file. Found error ${e}`);
        }
      }
    );

    this.server.tool(
      "readFile",
      "Read the contents of a file",
      {
        path: z.string().describe("Absolute path of the file to read"),
      },
      async ({ path }) => {
        const obj = await env.BUCKET.get(path);
        if (!obj || !obj.body)
          return textRes(`Error reading file at ${path}: not found`);
        try {
          return textRes(await obj.text());
        } catch (e: unknown) {
          return textRes(`Error reading file at ${path}: ${e}`);
        }
      }
    );

    this.server.tool("whoami", "Check who the user is", async () => {
      return textRes(`${this.props?.userId}`);
    });
  }
}

// HTML form page for users to write our password
function passwordPage(opts: { query: string; error?: string }) {
  const err = opts.error
    ? `<p class="text-red-600 mb-2">${opts.error}</p>`
    : "";
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ENTER THE MAGIC WORD</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="font-sans grid place-items-center min-h-screen bg-gray-100">
  <form method="POST" action="/authorize?${opts.query}" 
        class="bg-white p-6 rounded-lg shadow-md w-full max-w-xs">
    <h1 class="text-lg font-semibold mb-3">ENTER THE MAGIC WORD</h1>
    ${err}
    <label class="block text-sm mb-1">Password</label>
    <input name="password" type="password" required autocomplete="current-password"
           class="w-full border rounded px-3 py-2 mb-3" />
    <button type="submit"
            class="w-full py-2 bg-black text-white rounded font-medium hover:bg-gray-800">
      Continue
    </button>
  </form>
</body>
</html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

const defaultHandler = {
  async fetch(request: Request, env: any) {
    const provider = env.OAUTH_PROVIDER;
    const url = new URL(request.url);

    // Only handle our auth UI/flow here
    if (url.pathname !== "/authorize") {
      return new Response("NOT FOUND", { status: 404 });
    }

    // Parse the OAuth request
    const oauthReq = await provider.parseAuthRequest(request);

    // We render the password page for GET requests
    if (request.method === "GET") {
      return passwordPage({ query: url.searchParams.toString() });
    }

    // We validate the password in POST requests
    if (request.method === "POST") {
      const form = await request.formData();
      const password = String(form.get("password") || "");

      const SHARED_PASSWORD = env.SHARED_PASSWORD as string | undefined;
      if (!SHARED_PASSWORD) {
        return new Response("Server misconfigured: missing SHARED_PASSWORD", {
          status: 500,
        });
      }
      if (password !== SHARED_PASSWORD) {
        return passwordPage({
          query: url.searchParams.toString(),
          error: "Wrong password.",
        });
      }

      // We give everyone the same userId
      const userId = "friend";

      const { redirectTo } = await provider.completeAuthorization({
        request: oauthReq,
        userId,
        scope: [], // We don't care about scopes
        // We could add anything we wanted here so we could access it
        // within the MCP with `this.props`
        props: { userId },
        metadata: undefined,
      });

      return Response.redirect(redirectTo, 302);
    }

    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "GET, POST" },
    });
  },
};

export default new OAuthProvider({
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
  apiHandlers: { "/mcp": StorageMcp.serve("/mcp") },
  defaultHandler,
});