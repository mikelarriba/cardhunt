import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

const Index = lazy(() => import("./pages/Index"));
const PlayerDetail = lazy(() => import("./pages/PlayerDetail"));
const BulkCreatePlayers = lazy(() => import("./pages/BulkCreatePlayers"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Sellers = lazy(() => import("./pages/Sellers"));
const Collections = lazy(() => import("./pages/Collections"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const SellerDetail = lazy(() => import("./pages/SellerDetail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/player/:id" element={<PlayerDetail />} />
              <Route path="/bulk-create" element={<BulkCreatePlayers />} />
              <Route path="/sellers" element={<Sellers />} />
              <Route path="/seller/:id" element={<SellerDetail />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collection/:id" element={<CollectionDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
