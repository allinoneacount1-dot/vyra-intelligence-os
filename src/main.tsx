import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { Menu, X, ChevronRight } from "lucide-react";
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
/*  Navigation config — Apple-level grouped sections                   */
/* ------------------------------------------------------------------ */

const NAV_GROUPS = [
  {
    label: "INTELLIGENCE",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "◉" },
      { to: "/signals", label: "Signals", icon: "⚡" },
    ],
  },
  {
    label: "WORKSPACE",
    items: [
      { to: "/heatmap", label: "Heatmap", icon: "◎" },
      { to: "/agents", label: "Agents", icon: "◈" },
    ],
  },
  {
    label: "AI",
    items: [
      { to: "/copilot", label: "Copilot", icon: "◇" },
    ],
  },
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
      {/* ===== Sidebar — Apple-level floating panel ===== */}
      <Sidebar path={path} navigate={navigate} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ===== Main content ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 glass border-b border-vyra-border shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-vyra-text-dim hover:text-vyra-text hover:bg-vyra-card transition-colors"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <span className="font-mono font-bold text-xs tracking-[0.25em] text-vyra-text">
            VYRA
          </span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto bg-vyra-bg">
          {pages[path] || <DashboardPage />}
        </main>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar — Apple-level grouped floating panel                       */
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
        w-[260px] shrink-0
        flex flex-col
        glass-strong
        border-r border-vyra-border
        transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Logo — floating card style */}
      <button
        onClick={() => navigate("/")}
        className="mx-3 mt-4 mb-2 p-3 rounded-xl glass hover:bg-vyra-card-hover transition-all duration-200 block text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vyra-accent to-vyra-cyan flex items-center justify-center text-white font-black text-sm">
            V
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-vyra-text group-hover:text-white transition-colors">
              VYRA
            </h1>
            <p className="text-[9px] text-vyra-text-dim tracking-[0.15em] uppercase">Intelligence OS</p>
          </div>
        </div>
      </button>

      {/* Mobile close button */}
      <button
        onClick={onClose}
        className="md:hidden absolute top-5 right-3 flex items-center justify-center w-7 h-7 rounded-lg text-vyra-text-dim hover:text-vyra-text hover:bg-vyra-card transition-colors"
        aria-label="Close menu"
      >
        <X size={14} />
      </button>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="section-label px-2 mb-1.5">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = path === item.to;
                return (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className={`
                      w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                      transition-all duration-200 text-left group
                      ${isActive
                        ? "bg-vyra-accent/10 text-vyra-accent-light"
                        : "text-vyra-text-dim hover:text-vyra-text hover:bg-vyra-card"
                      }
                    `}
                  >
                    <span className={`text-xs ${isActive ? "text-vyra-accent-light" : "text-vyra-text-dim"}`}>
                      {item.icon}
                    </span>
                    <span className="text-[13px] font-medium flex-1">{item.label}</span>
                    {isActive && (
                      <ChevronRight size={12} className="text-vyra-accent-light opacity-60" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section — wallet + status */}
      <div className="p-3 space-y-2 border-t border-vyra-border">
        <WalletConnectButton />
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-vyra-green animate-pulse-dot" />
          <span className="text-[10px] text-vyra-text-dim font-mono">SYSTEM ONLINE</span>
        </div>
        <div className="text-[9px] text-vyra-text-dim px-2 font-mono">SOL · ETH · BASE · BNB</div>
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
