// VYRA Root Layout — HTML shell
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import "../styles/app.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VYRA — Multi-Chain Liquidity Intelligence OS" },
      { name: "description", content: "Real-time AI financial intelligence brain. Multi-chain liquidity prediction. Autonomous agent society." },
      { name: "theme-color", content: "#0a0a0f" },
    ],
    links: [
      { rel: "icon", href: "/vyra-logo.jpg", type: "image/jpeg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-vyra-bg text-vyra-text min-h-screen antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
