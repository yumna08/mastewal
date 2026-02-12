
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { Book, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { getApiErrorMessage } from '../services/api';

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const SignupPage: React.FC = () => {
  const [formData, setFormData] = React.useState({ name: '', email: '', password: '' });
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { signup } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse(formData);
    
    if (!result.success) {
      // Fix: Use 'issues' instead of 'errors' for ZodError access
      setError(result.error.issues[0].message);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await signup(formData.name, formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sign up failed.'));
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
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Create Account</h1>
          <p className="text-stone-500 font-sans text-sm">Join the mastewal reader community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 pl-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none transition-shadow"
                placeholder="Jane Reader"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none transition-shadow"
                placeholder="jane@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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
            Create Account
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <p className="text-center font-sans text-sm text-stone-500">
          Already have an account? <Link to="/login" className="text-stone-900 font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
