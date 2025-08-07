import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, BarChart3, Heart, BookOpen, Brain, Database, Compass } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
    {
        title: "Journey Map",
        url: createPageUrl("JourneyMap"),
        icon: Map,
        description: "Your global path"
    },
    {
        title: "Environment",
        url: createPageUrl("Environmental"),
        icon: BarChart3,
        description: "Climate & conditions"
    },
    {
        title: "Biology",
        url: createPageUrl("Biological"),
        icon: Heart,
        description: "Body responses"
    },
    {
        title: "Journal",
        url: createPageUrl("Journal"),
        icon: BookOpen,
        description: "Emotions & stories"
    },
    {
        title: "Insights",
        url: createPageUrl("Insights"),
        icon: Brain,
        description: "AI discoveries"
    },
    {
        title: "Data Archive",
        url: createPageUrl("DataArchive"),
        icon: Database,
        description: "Export & docs"
    },
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();

    return (
        <SidebarProvider>
            <style>{`
        :root {
          --forest-deep: #1a2e1a;
          --sage-soft: #9caf88;
          --terracotta: #c65d07;
          --gold-accent: #d4af37;
          --navy-deep: #1e3a5f;
          --cream: #faf8f3;
          --stone: #e8e2d4;
        }
        
        body {
          background: linear-gradient(135deg, var(--cream) 0%, #f5f1ea 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .luxury-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(156, 175, 136, 0.2);
          box-shadow: 0 8px 32px rgba(26, 46, 26, 0.1);
        }
        
        .nav-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .nav-item:hover {
          background: linear-gradient(135deg, var(--sage-soft), #b8c9a4);
          transform: translateX(4px);
        }
        
        .nav-item.active {
          background: linear-gradient(135deg, var(--forest-deep), #2a4a2a);
          color: white;
        }
      `}</style>

            <div className="min-h-screen flex w-full">
                <Sidebar className="border-r border-stone/30 bg-white/90 backdrop-blur-md">
                    <SidebarHeader className="border-b border-stone/30 p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-forest-deep to-sage-soft rounded-xl flex items-center justify-center">
                                <Compass className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-forest-deep text-lg tracking-tight">Living Data</h2>
                                <p className="text-xs text-sage-soft font-medium">Experience Dashboard</p>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="p-3">
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-2">
                                    {navigationItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                className={`nav-item rounded-xl p-4 ${
                                                    location.pathname === item.url ? 'active' : ''
                                                }`}
                                            >
                                                <Link to={item.url} className="flex items-center gap-4">
                                                    <div className="w-8 h-8 flex items-center justify-center">
                                                        <item.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm">{item.title}</div>
                                                        <div className="text-xs opacity-70 truncate">{item.description}</div>
                                                    </div>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>

                <main className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-white/80 backdrop-blur-md border-b border-stone/30 px-6 py-4 md:hidden">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="hover:bg-sage-soft/20 p-2 rounded-lg transition-colors" />
                            <h1 className="text-xl font-bold text-forest-deep">Living Data</h1>
                        </div>
                    </header>

                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}