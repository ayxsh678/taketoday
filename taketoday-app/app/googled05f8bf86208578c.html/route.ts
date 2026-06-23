export function GET() {
  return new Response("google-site-verification: googled05f8bf86208578c.html", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
