import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/AuthPage';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Helmet>
          <title>Card Tracker - Sign In to Manage Your Collection</title>
          <meta name="description" content="Sign in to Card Tracker to start managing your sports card collection. Track players, organize by sport and team, and monitor your collection progress." />
        </Helmet>
        <AuthPage />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | Card Tracker</title>
        <meta name="description" content="View and manage your sports card collection dashboard. Track players, filter by sport and team, and monitor your collection progress." />
      </Helmet>
      <Dashboard />
    </>
  );
};

export default Index;
