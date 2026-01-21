import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, TrendingUp, Layers, LayoutGrid, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Card stack effect */}
      <rect
        x="8"
        y="10"
        width="24"
        height="32"
        rx="3"
        className="fill-primary/30"
        transform="rotate(-8 8 10)"
      />
      <rect
        x="12"
        y="6"
        width="24"
        height="32"
        rx="3"
        className="fill-primary"
      />
      {/* Card shine */}
      <path
        d="M18 12L30 12"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-primary-foreground/60"
      />
      <path
        d="M18 18L26 18"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-primary-foreground/40"
      />
    </svg>
  );
}

function AuthCard() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast({
          title: 'Check Your Email',
          description: 'We sent you a password reset link.',
        });
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast({
          title: 'Account Created!',
          description: 'You can now start tracking your collection.',
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({
          title: 'Welcome Back!',
          description: 'Ready to manage your collection.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card w-full max-w-md p-8 backdrop-blur-xl bg-card/80 border border-border/50 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">
          {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isForgotPassword 
            ? 'Enter your email to receive a reset link' 
            : isSignUp 
              ? 'Start tracking your collection today' 
              : 'Sign in to continue'}
        </p>
      </div>

      {!isForgotPassword && (
        <>
          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 h-11 bg-background/50 border-border/50 hover:bg-secondary/80 transition-colors"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <Chrome className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50"
              required
            />
          </div>
        </div>

        {!isForgotPassword && (
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50"
                minLength={6}
                required
              />
            </div>
          </div>
        )}

        {!isForgotPassword && !isSignUp && (
          <button
            type="button"
            onClick={() => setIsForgotPassword(true)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Forgot password?
          </button>
        )}

        <Button
          type="submit"
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-all"
          disabled={loading}
        >
          {loading ? 'Loading...' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        {isForgotPassword ? (
          <button
            type="button"
            onClick={() => setIsForgotPassword(false)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Back to sign in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        )}
      </div>
    </div>
  );
}

const features = [
  {
    icon: TrendingUp,
    title: 'Track Values',
    description: 'Monitor prices and find the best value for every player in your collection.',
  },
  {
    icon: Layers,
    title: 'Massive Entry',
    description: 'Add entire sets in seconds with our bulk creation tool for rapid cataloging.',
  },
  {
    icon: LayoutGrid,
    title: 'Visual Collections',
    description: 'Organize your cards into custom tags and view them in standard, compact, or table layouts.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <span className="font-display font-bold text-xl text-foreground">
                Card Hunt
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight mb-6">
                Your Collection,{' '}
                <span className="text-gradient-gold">Quantified.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                The all-in-one tracker for serious sports card collectors. 
                Manage players, track values, and organize collections with a modern, flat interface.
              </p>
              
              {/* Stats or trust indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">10+</div>
                  <div className="text-sm text-muted-foreground">Sports Supported</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">3</div>
                  <div className="text-sm text-muted-foreground">View Modes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">∞</div>
                  <div className="text-sm text-muted-foreground">Collections</div>
                </div>
              </div>
            </div>

            {/* Right: Auth Card */}
            <div className="flex justify-center lg:justify-end">
              <AuthCard />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by collectors, for collectors. Every feature designed to make managing your collection effortless.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  'glass-card p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="text-sm text-muted-foreground">
              Made for Collectors.
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Card Hunt. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
