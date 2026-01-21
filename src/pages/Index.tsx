import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { LandingPage } from '@/components/LandingPage';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return (
      <>
        <Helmet>
          <title>Card Hunt - Your Collection, Quantified</title>
          <meta name="description" content="The all-in-one tracker for serious sports card collectors. Manage players, track values, and organize collections with a modern, flat interface." />
        </Helmet>
        <LandingPage />
      </>
    );
  }

  // Show dashboard for authenticated users
  return (
    <>
      <Helmet>
        <title>Dashboard | Card Hunt</title>
        <meta name="description" content="View and manage your sports card collection dashboard. Track players, filter by sport and team, and monitor your collection progress." />
      </Helmet>
      <Dashboard />
    </>
  );
};

export default Index;
