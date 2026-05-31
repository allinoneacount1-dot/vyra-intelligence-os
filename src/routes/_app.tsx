// VYRA App Layout — Sidebar navigation + main content area
import { Outlet, createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", emoji: "📊", desc: "Intelligence Overview" },
  { to: "/signals", label: "Signals", emoji: "⚡", desc: "Real-time Signal Stream" },
  { to: "/trending", label: "Trending", emoji: "🔥", desc: "DEX Trending Tokens" },
  { to: "/agents", label: "Agents", emoji: "🤖", desc: "Agent Society" },
  { to: "/heatmap", label: "Heatmap", emoji: "🗺️", desc: "Liquidity Map" },
  { to: "/copilot", label: "Copilot", emoji: "🧠", desc: "AI Assistant" },
];

function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-vyra-surface border-r border-vyra-border flex flex-col shrink-0">
        {/* Logo */}
        <Link to="/" className="p-6 border-b border-vyra-border block">
          <div className="flex items-center gap-3">
            <img
              src="/vyra-logo-new.png"
              alt="VYRA"
              className="w-10 h-10 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold tracking-wider bg-gradient-to-r from-vyra-accent to-vyra-cyan bg-clip-text text-transparent">
                VYRA
              </h1>
              <p className="text-[10px] text-vyra-text-dim tracking-widest uppercase">
                Intelligence OS
              </p>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-vyra-accent/15 text-vyra-accent-light border border-vyra-accent/30"
                    : "hover:bg-vyra-card text-vyra-text-dim hover:text-vyra-text"
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-[10px] text-vyra-text-dim">{item.desc}</div>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-vyra-cyan"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status */}
        <div className="p-4 border-t border-vyra-border">
          <div className="flex items-center gap-2 text-xs text-vyra-text-dim">
            <div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse" />
            <span>System Online</span>
          </div>
          <div className="text-[10px] text-vyra-text-dim mt-1">
            SOL • ETH • BASE • BNB
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-vyra-bg">
        <Outlet />
      </main>
    </div>
  );
}
