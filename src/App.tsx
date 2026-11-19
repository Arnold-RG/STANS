import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Dashboard from "./pages/Dashboard";

const Documentation = lazy(() => import("./pages/Documentation"));
const Concepts = lazy(() => import("./pages/Concepts"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Sonner position="top-center" offset={12} />
        <HashRouter>
          <Suspense
            fallback={
              <div className="asphalt-desk grid min-h-[100dvh] place-items-center px-6">
                <div className="text-center">
                  <p className="desk-brand">STANS</p>
                  <p className="eyebrow mt-3">Opening live desk…</p>
                </div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/concepts" element={<Concepts />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
