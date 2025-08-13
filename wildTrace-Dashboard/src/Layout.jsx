import React, { useState } from "react";
import { NavLink, useLocation , Outlet} from "react-router-dom";
import { Map, BarChart3, Heart, BookOpen, Brain, Database, Compass, Menu } from "lucide-react";

const createPageUrl = (pageName) => `/${String(pageName || "").toLowerCase()}`;

const navigationItems = [
  { title: "Journey Map", url: createPageUrl("JourneyMap"), icon: Map, description: "Your global path" },
  { title: "Environment", url: createPageUrl("Environmental"), icon: BarChart3, description: "Climate & conditions" },
  { title: "Biology", url: createPageUrl("Biological"), icon: Heart, description: "Body responses" },
  { title: "Journal", url: createPageUrl("Journal"), icon: BookOpen, description: "Emotions & stories" },
  { title: "Insights", url: createPageUrl("Insights"), icon: Brain, description: "AI discoveries" },
  { title: "Data Archive", url: createPageUrl("Data-Archive"), icon: Database, description: "Export & docs" },
];

function DesktopSidebar({ location }) {
  return (
    <aside className="border-r border-stone-200 bg-white/90 backdrop-blur-md w-72 shrink-0 hidden md:flex md:flex-col">
      <div className="border-b border-stone-200 p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-900 to-green-300 rounded-xl flex items-center justify-center">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-green-900 text-lg tracking-tight">WildTrace</h2>
          <p className="text-xs text-green-900 font-medium">Experience Dashboard</p>
        </div>
      </div>
      <nav className="p-3 overflow-y-auto">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.title}>
              <NavLink to={item.url} className={({ isActive }) => `nav-item rounded-xl p-4 flex items-center gap-4 ${isActive || location.pathname === item.url ? "active" : ""}`}>
                <div className="w-8 h-8 flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="text-xs opacity-70 truncate">{item.description}</div>
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function MobileNavigation({ location }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-stone-200 px-4 py-3 w-full fixed top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen((v) => !v)} className="hover:bg-green-300/20 p-2 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-green-900">Living Data</h1>
        </div>
      </header>
      <div className={`md:hidden fixed inset-0 z-30 ${open ? "" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <div className={`absolute top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-md border-r border-stone-200 transform transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-4 border-b border-stone-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-green-900 to-green-300 rounded-lg flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-green-900">Living Data</div>
              <div className="text-[10px] text-green-300">Experience Dashboard</div>
            </div>
          </div>
          <nav className="p-3 overflow-y-auto">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.title}>
                  <NavLink to={item.url} className={({ isActive }) => `nav-item rounded-xl p-4 flex items-center gap-4 ${isActive || location.pathname === item.url ? "active" : ""}`} onClick={() => setOpen(false)}>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{item.title}</div>
                      <div className="text-xs opacity-70 truncate">{item.description}</div>
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex w-full">
      <DesktopSidebar location={location} />
      <MobileNavigation location={location} />
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <div className="md:hidden h-[56px]" />
        <div><Outlet /></div>
      </main>
    </div>
  );
}
