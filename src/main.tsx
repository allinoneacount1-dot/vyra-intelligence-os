import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./styles/app.css";

// Pages
import LandingPage from "./pages/Landing";
import DashboardPage from "./pages/Dashboard";
import SignalsPage from "./pages/Signals";
import AgentsPage from "./pages/Agents";
import HeatmapPage from "./pages/Heatmap";
import CopilotPage from "./pages/Copilot";

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, "", to);
    setPath(to);
  };

  if (path === "/") return <LandingPage navigate={navigate} />;

  const pages: Record<string, React.ReactNode> = {
    "/dashboard": <DashboardPage />,
    "/signals": <SignalsPage />,
    "/agents": <AgentsPage />,
    "/heatmap": <HeatmapPage />,
    "/copilot": <CopilotPage />,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar path={path} navigate={navigate} />
      <main className="flex-1 overflow-y-auto bg-vyra-bg">
        {pages[path] || <DashboardPage />}
      </main>
    </div>
  );
}

function Sidebar({ path, navigate }: { path: string; navigate: (to: string) => void }) {
  const NAV = [
    { to: "/dashboard", label: "Dashboard", emoji: "📊", desc: "Intelligence Overview" },
    { to: "/signals", label: "Signals", emoji: "⚡", desc: "Real-time Signal Stream" },
    { to: "/agents", label: "Agents", emoji: "🤖", desc: "Agent Society" },
    { to: "/heatmap", label: "Heatmap", emoji: "🗺️", desc: "Liquidity Map" },
    { to: "/copilot", label: "Copilot", emoji: "🧠", desc: "AI Assistant" },
  ];

  return (
    <aside className="w-64 bg-vyra-surface border-r border-vyra-border flex flex-col shrink-0">
      <button onClick={() => navigate("/")} className="p-6 border-b border-vyra-border block text-left">
        <div className="flex items-center gap-3">
          <img src="/vyra-logo-new.png" alt="VYRA" className="w-10 h-10 object-contain rounded-lg" />
          <div>
            <h1 className="text-lg font-bold tracking-wider bg-gradient-to-r from-vyra-accent to-vyra-cyan bg-clip-text text-transparent">VYRA</h1>
            <p className="text-[10px] text-vyra-text-dim tracking-widest uppercase">Intelligence OS</p>
          </div>
        </div>
      </button>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => {
          const isActive = path === item.to;
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
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
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-vyra-cyan" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-vyra-border">
        <div className="flex items-center gap-2 text-xs text-vyra-text-dim">
          <div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse" />
          <span>System Online</span>
        </div>
        <div className="text-[10px] text-vyra-text-dim mt-1">SOL • ETH • BASE • BNB</div>
      </div>
    </aside>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
