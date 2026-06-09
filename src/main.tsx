import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { Menu, X } from "lucide-react";
import "./styles/app.css";

// Pages
import LandingPage from "./pages/Landing";
import DashboardPage from "./pages/Dashboard";
import SignalsPage from "./pages/Signals";
import AgentsPage from "./pages/Agents";
import HeatmapPage from "./pages/Heatmap";
import CopilotPage from "./pages/Copilot";
import TokenDetailPage from "./pages/TokenDetail";

// Components
import { WalletConnectButton, initWalletAutoConnect } from "./components/WalletConnect";
import NewsFeed from "./components/NewsFeed";

/* ------------------------------------------------------------------ */
/*  Navigation config                                                  */
/* ------------------------------------------------------------------ */

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "📊", desc: "Intelligence Overview" },
  { to: "/signals", label: "Signals", icon: "⚡", desc: "Real-time Signal Stream" },
  { to: "/agents", label: "Agents", icon: "🤖", desc: "Agent Society" },
  { to: "/heatmap", label: "Heatmap", icon: "🗺️", desc: "Liquidity Map" },
  { to: "/copilot", label: "Copilot", icon: "🧠", desc: "AI Assistant" },
];

/* ------------------------------------------------------------------ */
/*  App shell                                                          */
/* ------------------------------------------------------------------ */

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState({}, "", to);
    setPath(to);
    setDrawerOpen(false);
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  // Landing page — full width, no sidebar
  if (path === "/") return <LandingPage navigate={navigate} />;

  // Token detail page
  if (path.startsWith("/token/")) {
    return (
      <div className="flex h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-vyra-bg">
          <TokenDetailPage />
        </main>
      </div>
    );
  }

  const pages: Record<string, React.ReactNode> = {
    "/dashboard": <DashboardPage navigate={navigate} />,
    "/signals": <SignalsPage navigate={navigate} />,
    "/agents": <AgentsPage navigate={navigate} />,
    "/heatmap": <HeatmapPage navigate={navigate} />,
    "/copilot": <CopilotPage navigate={navigate} />,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ===== Sidebar — desktop always visible, mobile drawer ===== */}
      <Sidebar path={path} navigate={navigate} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ===== Main content ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-vyra-surface border-b border-vyra-border shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-vyra-text-dim hover:text-vyra-text hover:bg-vyra-card transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-mono font-bold text-sm tracking-wider bg-gradient-to-r from-vyra-accent to-vyra-cyan bg-clip-text text-transparent">
            VYRA
          </span>
          <div className="w-9" /> {/* spacer for centering */}
        </header>

        <main className="flex-1 overflow-y-auto bg-vyra-bg">
          {pages[path] || <DashboardPage />}
        </main>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

function Sidebar({
  path,
  navigate,
  open,
  onClose,
}: {
  path: string;
  navigate: (to: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-vyra-surface border-r border-vyra-border
        flex flex-col shrink-0
        transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Logo */}
      <button onClick={() => navigate("/")} className="p-5 border-b border-vyra-border block text-left">
        <div className="flex items-center gap-3">
          <img src="/vyra-logo-new.png" alt="VYRA" className="w-9 h-9 object-contain rounded-lg" />
          <div>
            <h1 className="text-base font-bold tracking-wider bg-gradient-to-r from-vyra-accent to-vyra-cyan bg-clip-text text-transparent">
              VYRA
            </h1>
            <p className="text-[9px] text-vyra-text-dim tracking-widest uppercase">Intelligence OS</p>
          </div>
        </div>
      </button>

      {/* Mobile close button */}
      <button
        onClick={onClose}
        className="md:hidden absolute top-4 right-3 flex items-center justify-center w-8 h-8 rounded-lg text-vyra-text-dim hover:text-vyra-text hover:bg-vyra-card transition-colors"
        aria-label="Close menu"
      >
        <X size={18} />
      </button>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const isActive = path === item.to;
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left ${
                isActive
                  ? "bg-vyra-accent/15 text-vyra-accent-light border border-vyra-accent/30"
                  : "hover:bg-vyra-card text-vyra-text-dim hover:text-vyra-text"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className="text-[10px] text-vyra-text-dim truncate">{item.desc}</div>
              </div>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-vyra-cyan shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Wallet Connect */}
      <div className="p-3 border-t border-vyra-border">
        <WalletConnectButton />
      </div>

      {/* System status */}
      <div className="p-3 border-t border-vyra-border">
        <div className="flex items-center gap-2 text-xs text-vyra-text-dim">
          <div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse" />
          <span>System Online</span>
        </div>
        <div className="text-[10px] text-vyra-text-dim mt-1">SOL • ETH • BASE • BNB</div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Mount                                                              */
/* ------------------------------------------------------------------ */

initWalletAutoConnect();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
