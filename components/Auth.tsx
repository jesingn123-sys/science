
import React, { useState } from 'react';
import { User } from '../types';
import { School, ArrowRight, Lock, Mail, UserPlus, LogIn } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const usersStr = localStorage.getItem('vibecheck_users');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    if (isLogin) {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid email or password');
      }
    } else {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
      if (users.find(u => u.email === email)) {
        setError('User already exists');
        return;
      }
      
      const newUser: User = {
        id: crypto.randomUUID(),
        email,
        password,
        schoolName
      };
      
      const updatedUsers = [...users, newUser];
      localStorage.setItem('vibecheck_users', JSON.stringify(updatedUsers));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-brand-blue p-8 text-center relative overflow-hidden">
           <div className="relative z-10">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-brand-blue shadow-lg">
                <School size={32} />
             </div>
             <h1 className="text-3xl font-bold text-white mb-1">VibeCheck</h1>
             <p className="text-blue-100 text-sm">School Management OS</p>
           </div>
           
           {/* Decorative circles */}
           <div className="absolute top-[-20%] left-[-20%] w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
           <div className="absolute bottom-[-20%] right-[-20%] w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-6 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">School Name (Optional)</label>
                 <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-brand-blue transition-colors">
                  <School size={18} className="text-slate-400" />
                  <input 
                    type="text" 
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. Riverdale High"
                    className="bg-transparent w-full outline-none text-slate-900 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
               <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-brand-blue transition-colors">
                <Mail size={18} className="text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.com"
                  className="bg-transparent w-full outline-none text-slate-900 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
               <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-brand-blue transition-colors">
                <Lock size={18} className="text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent w-full outline-none text-slate-900 text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
            >
              {isLogin ? (
                <>Log In <LogIn size={18} /></>
              ) : (
                <>Create Account <UserPlus size={18} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
