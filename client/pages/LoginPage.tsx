
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { Book, Mail, Lock, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { getApiErrorMessage } from '../services/api';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const LoginPage: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const googleButtonRef = React.useRef<HTMLDivElement | null>(null);
  const [isGoogleEnabled] = React.useState(Boolean('514542200196-k4uubjntd1lroh17j1rf53h9v6g35aam.apps.googleusercontent.com'));
  const { login, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    const clientId = '514542200196-k4uubjntd1lroh17j1rf53h9v6g35aam.apps.googleusercontent.com';
    if (!clientId) {
      return;
    }

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            setIsSubmitting(true);
            setError(null);
            await loginWithGoogle(response.credential);
            navigate('/');
          } catch (err) {
            setError(getApiErrorMessage(err, 'Google login failed.'));
          } finally {
            setIsSubmitting(false);
          }
        },
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const scriptId = 'google-identity-service';
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);
  }, [loginWithGoogle, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    
    if (!result.success) {
      // Fix: Use 'issues' instead of 'errors' for ZodError access
      setError(result.error.issues[0].message);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center font-serif bg-stone-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-2xl shadow-xl border border-stone-100">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-stone-800 text-stone-100 rounded-xl mb-4 shadow-lg">
            <Book className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Welcome back</h1>
          <p className="text-stone-500 font-sans text-sm">Log in to your mastewal account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none transition-shadow"
                placeholder="reader@mastewal.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none transition-shadow"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-medium pl-1">{error}</p>}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-stone-800 text-stone-50 py-2 rounded-lg font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 group shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Sign In
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <div className="relative font-sans py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
            <span className="bg-white px-2 text-stone-400">Or continue with</span>
          </div>
        </div>

        <div className="flex justify-center">
          {isGoogleEnabled ? (
            <div ref={googleButtonRef} className="min-h-[44px]" />
          ) : (
            <p className="text-xs font-sans text-stone-400">Google login is not configured.</p>
          )}
        </div>

        <p className="text-center font-sans text-sm text-stone-500">
          Don't have an account? <Link to="/signup" className="text-stone-900 font-bold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
