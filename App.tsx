
import React, { useState, useEffect } from 'react';
import { UserRole, Job, Transaction, UserState } from './types';
import { generateJobs, evaluateJobTask } from './services/geminiService';
import WalletDisplay from './components/WalletDisplay';
import JobCard from './components/JobCard';

const App: React.FC = () => {
  const [view, setView] = useState<'LANDING' | 'ROLE_SELECT' | 'PROFILE_SETUP' | 'DASHBOARD'>('LANDING');
  const [user, setUser] = useState<UserState>({
    id: 'user-' + Math.random().toString(36).substr(2, 4),
    role: null,
    wallet: {
      balance: 0,
      transactions: []
    },
    careerLevel: 1,
    experience: 0,
    profile: {
      name: '',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      skills: [],
      location: '',
      rating: 5.0,
      jobsCompleted: 0
    }
  });

  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [submission, setSubmission] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmployerPosting, setIsEmployerPosting] = useState(false);
  
  const [newJobForm, setNewJobForm] = useState({ 
    title: '', 
    description: '', 
    reward: 100000, 
    location: 'Remote', 
    timeLimit: '24 Hours',
    image: '' 
  });

  useEffect(() => {
    if (user.role === 'WORKER' && view === 'DASHBOARD') {
      fetchNewJobs();
    }
  }, [user.role, view]);

  const fetchNewJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const jobs = await generateJobs(user.careerLevel);
      const mappedJobs = jobs.map(j => ({
        ...j,
        employerId: 'system',
        location: j.location || 'Remote',
        timeLimit: j.timeLimit || '48 Hours',
        status: 'OPEN' as const
      }));
      setAvailableJobs(prev => [...prev.filter(j => j.employerId !== 'system'), ...mappedJobs]);
    } catch (error) {
      console.error("Error fetching jobs", error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleDeposit = (amount: number, method: 'GOPAY' | 'OVO') => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'DEPOSIT',
      amount,
      date: new Date().toISOString(),
      description: `Deposited via ${method}`
    };

    setUser(prev => ({
      ...prev,
      wallet: {
        balance: prev.wallet.balance + amount,
        transactions: [newTransaction, ...prev.wallet.transactions]
      }
    }));
  };

  const handleApply = (job: Job) => {
    if (user.wallet.balance < 50000) {
      alert("Minimum balance of Rp 50.000 required for job insurance/commitment.");
      return;
    }
    setAvailableJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'ASSIGNED', workerId: user.id } : j));
    setActiveJob({ ...job, status: 'ASSIGNED', workerId: user.id });
  };

  const handleSubmission = async () => {
    if (!activeJob || !submission.trim()) return;
    setIsSubmitting(true);
    
    setAvailableJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, status: 'SUBMITTED', submissionText: submission } : j));
    
    if (activeJob.employerId === 'system') {
      try {
        const evaluation = await evaluateJobTask(activeJob, submission);
        if (evaluation.success) {
          finalizeJob(activeJob);
        } else {
          alert(`Rejected by AI Reviewer: ${evaluation.feedback}`);
        }
      } catch (e) {
        alert("Evaluation error");
      }
    } else {
      alert("Submission sent to Employer for manual approval!");
    }
    
    setActiveJob(null);
    setSubmission('');
    setIsSubmitting(false);
  };

  const finalizeJob = (job: Job) => {
    const earningTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'EARNING',
      amount: job.reward,
      date: new Date().toISOString(),
      description: `Completed: ${job.title}`
    };

    setUser(prev => ({
      ...prev,
      experience: prev.experience + 25,
      careerLevel: Math.floor((prev.experience + 25) / 100) + 1,
      profile: {
        ...prev.profile,
        jobsCompleted: prev.profile.jobsCompleted + 1,
        rating: Math.min(5, prev.profile.rating + 0.05)
      },
      wallet: {
        balance: prev.wallet.balance + job.reward,
        transactions: [earningTransaction, ...prev.wallet.transactions]
      }
    }));

    setAvailableJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'COMPLETED' } : j));
  };

  const postJobAsEmployer = () => {
    if (user.wallet.balance < newJobForm.reward) {
      alert("Insufficient balance to guarantee payment for this gig.");
      return;
    }

    const job: Job = {
      id: 'job-' + Math.random().toString(36).substr(2, 9),
      title: newJobForm.title,
      description: newJobForm.description,
      reward: newJobForm.reward,
      category: 'Custom Gig',
      difficulty: 'Medium',
      status: 'OPEN',
      employerId: user.id,
      location: newJobForm.location,
      timeLimit: newJobForm.timeLimit,
      imageUrl: newJobForm.image
    };

    setAvailableJobs(prev => [job, ...prev]);
    setIsEmployerPosting(false);
    setNewJobForm({ title: '', description: '', reward: 100000, location: 'Remote', timeLimit: '24 Hours', image: '' });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUser(prev => ({ ...prev, profile: { ...prev.profile, avatar: base64 } }));
      };
      reader.readAsDataURL(file);
    }
  };

  const approveJob = (job: Job) => {
    setAvailableJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'COMPLETED' } : j));
    
    const paymentTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'PAYMENT',
      amount: -job.reward,
      date: new Date().toISOString(),
      description: `Paid for job: ${job.title}`
    };

    setUser(prev => ({
      ...prev,
      wallet: {
        balance: prev.wallet.balance - job.reward,
        transactions: [paymentTx, ...prev.wallet.transactions]
      }
    }));
    alert("Worker payment released successfully!");
  };

  // --------------------------------------------------------------------------
  // Landing Page View
  // --------------------------------------------------------------------------
  if (view === 'LANDING') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <nav className="max-w-7xl mx-auto w-full px-6 h-24 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-100">K</div>
              <h1 className="text-2xl font-black text-emerald-900 tracking-tighter">KarirKita</h1>
           </div>
           <button onClick={() => setView('ROLE_SELECT')} className="px-6 py-2 border-2 border-emerald-600 text-emerald-600 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all">
             Login
           </button>
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
          <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 animate-bounce">Marketplace Alpha 1.0</span>
          <h1 className="text-6xl md:text-8xl font-black text-emerald-900 tracking-tight leading-[0.9] mb-8">
            Build your <span className="text-emerald-600">Digital Empire</span> from anywhere.
          </h1>
          <p className="text-xl text-emerald-900/50 font-medium mb-12 leading-relaxed">
            The world's first AI-powered virtual career simulator. Freelance for global clients or build your own workforce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={() => setView('ROLE_SELECT')}
              className="px-10 py-5 bg-emerald-600 text-white font-black rounded-2xl text-lg shadow-2xl shadow-emerald-200 hover:scale-[1.05] transition-all uppercase tracking-widest"
            >
              Start Your Career
            </button>
            <button className="px-10 py-5 bg-emerald-50 text-emerald-600 font-black rounded-2xl text-lg hover:bg-emerald-100 transition-all uppercase tracking-widest">
              See How It Works
            </button>
          </div>
          <div className="mt-20 grid grid-cols-3 gap-12 text-center">
            <div>
              <p className="text-3xl font-black text-emerald-900">Rp 100k</p>
              <p className="text-xs font-bold text-emerald-600/50 uppercase tracking-widest mt-1">Min Deposit</p>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-900">5.0k+</p>
              <p className="text-xs font-bold text-emerald-600/50 uppercase tracking-widest mt-1">Active Gigs</p>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-900">4.9/5</p>
              <p className="text-xs font-bold text-emerald-600/50 uppercase tracking-widest mt-1">User Rating</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Role Selection View
  // --------------------------------------------------------------------------
  if (view === 'ROLE_SELECT') {
    return (
      <div className="min-h-screen bg-emerald-50/20 flex flex-col items-center justify-center p-6 text-gray-900">
        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex justify-center mb-12">
             <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-emerald-100">K</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-emerald-900 mb-4 text-center tracking-tighter">Choose Your Path</h1>
          <p className="text-lg text-emerald-600/60 text-center mb-12 font-medium">How do you want to play today?</p>
          <div className="grid md:grid-cols-2 gap-8">
            <button 
              onClick={() => { setUser(p => ({ ...p, role: 'WORKER' })); setView('PROFILE_SETUP'); }} 
              className="group bg-white p-10 rounded-[2.5rem] border-2 border-emerald-100 hover:border-emerald-600 hover:shadow-2xl hover:shadow-emerald-100 transition-all text-left"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-tools text-2xl text-emerald-600"></i>
              </div>
              <h2 className="text-2xl font-bold mb-2">I want to Work</h2>
              <p className="text-emerald-900/60 font-medium">Earn money by completing tasks and level up your career.</p>
            </button>
            <button 
              onClick={() => { setUser(p => ({ ...p, role: 'EMPLOYER' })); setView('PROFILE_SETUP'); }} 
              className="group bg-white p-10 rounded-[2.5rem] border-2 border-emerald-100 hover:border-emerald-600 hover:shadow-2xl hover:shadow-emerald-100 transition-all text-left"
            >
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-handshake text-2xl text-white"></i>
              </div>
              <h2 className="text-2xl font-bold mb-2">I want to Hire</h2>
              <p className="text-gray-500 font-medium">Delegate tasks to others and build your own digital empire.</p>
            </button>
          </div>
          <button onClick={() => setView('LANDING')} className="mt-12 block mx-auto text-emerald-300 hover:text-emerald-600 font-bold uppercase text-xs tracking-widest">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Profile Setup View
  // --------------------------------------------------------------------------
  if (view === 'PROFILE_SETUP') {
    return (
      <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white p-10 rounded-[3rem] border border-emerald-50 shadow-2xl">
          <h2 className="text-3xl font-black mb-8 text-emerald-900 tracking-tight">Identity Setup</h2>
          <div className="space-y-6">
            <div className="flex flex-col items-center mb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-50 mb-4 relative group shadow-lg">
                <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-emerald-600/80 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <i className="fas fa-camera text-xl mb-1"></i>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Profile Picture</p>
            </div>
            <div>
              <label className="block text-xs font-black text-emerald-600 mb-2 uppercase tracking-widest">Your Professional Name</label>
              <input 
                type="text" 
                value={user.profile.name} 
                onChange={e => setUser(p => ({ ...p, profile: { ...p.profile, name: e.target.value } }))} 
                className="w-full px-5 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none transition-all font-bold text-emerald-900" 
                placeholder="Andi Pratama" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-black text-emerald-600 mb-2 uppercase tracking-widest">Base Location</label>
                  <input 
                    type="text" 
                    value={user.profile.location} 
                    onChange={e => setUser(p => ({ ...p, profile: { ...p.profile, location: e.target.value } }))} 
                    className="w-full px-5 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl outline-none font-bold text-emerald-900" 
                    placeholder="Jakarta" 
                  />
               </div>
               <div>
                  <label className="block text-xs font-black text-emerald-600 mb-2 uppercase tracking-widest">Main Skills</label>
                  <input 
                    type="text" 
                    onChange={e => setUser(p => ({ ...p, profile: { ...p.profile, skills: e.target.value.split(',').map(s => s.trim()) } }))} 
                    className="w-full px-5 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl outline-none font-bold text-emerald-900" 
                    placeholder="Writing, Coding" 
                  />
               </div>
            </div>
            <button 
              onClick={() => setView('DASHBOARD')} 
              disabled={!user.profile.name}
              className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 uppercase tracking-widest text-sm"
            >
              Enter Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Main Dashboard View
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen pb-20 bg-emerald-50/20">
      <header className="bg-white border-b border-emerald-50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl">K</div>
            <h1 className="text-xl font-black text-emerald-900 tracking-tight">KarirKita</h1>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 bg-emerald-50/50 px-4 py-2 rounded-2xl border border-emerald-100">
                <img src={user.profile.avatar} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="avatar" />
                <div className="hidden sm:block">
                   <p className="text-xs font-black text-emerald-900">{user.profile.name || 'Professional'}</p>
                   <div className="flex text-[10px] text-emerald-600 font-black items-center gap-1">
                     <i className="fas fa-star text-[8px]"></i>
                     <span>{user.profile.rating.toFixed(1)}</span>
                     <span className="mx-1 opacity-20">|</span>
                     <span>{user.role}</span>
                   </div>
                </div>
             </div>
            <button onClick={() => setView('LANDING')} className="text-xs font-bold text-emerald-300 hover:text-emerald-600 uppercase tracking-widest transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <WalletDisplay wallet={user.wallet} onDeposit={handleDeposit} />

        {user.role === 'WORKER' ? (
          <div className="space-y-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-6 md:col-span-1">
                <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-6 border-b border-emerald-50 pb-2">Experience</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-emerald-900/40 font-black uppercase text-[10px]">Level {user.careerLevel}</span>
                        <span className="font-black text-emerald-600">{user.experience % 100}%</span>
                      </div>
                      <div className="w-full bg-emerald-50 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full transition-all duration-1000" style={{ width: `${user.experience % 100}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-emerald-900/40 font-black uppercase text-[10px]">Success</span>
                        <span className="font-black text-emerald-900">{(user.profile.rating / 5 * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-emerald-900/40 font-black uppercase text-[10px]">Jobs Done</span>
                        <span className="font-black text-emerald-900">{user.profile.jobsCompleted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-3">
                    <i className="fas fa-bolt text-amber-500"></i>
                    Job Marketplace
                  </h2>
                  <button onClick={fetchNewJobs} className="bg-white border border-emerald-100 text-emerald-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-50 transition-all shadow-sm">
                    <i className="fas fa-sync mr-2"></i>Refresh Gigs
                  </button>
                </div>
                {isLoadingJobs ? (
                  <div className="grid sm:grid-cols-2 gap-6 animate-pulse">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="bg-white h-64 rounded-[2.5rem] border border-emerald-50"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {availableJobs.filter(j => j.status === 'OPEN').map(job => (
                      <JobCard key={job.id} job={job} onApply={handleApply} />
                    ))}
                    {availableJobs.filter(j => j.status === 'OPEN').length === 0 && (
                       <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-emerald-100 text-emerald-200">
                          <i className="fas fa-compass text-4xl mb-4"></i>
                          <p className="font-black uppercase text-xs tracking-widest">Marketplace is quiet right now...</p>
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
             <div className="md:col-span-1">
                <div className="bg-emerald-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200 relative overflow-hidden">
                  <i className="fas fa-briefcase absolute -right-8 -bottom-8 text-9xl text-emerald-500 opacity-30 rotate-12"></i>
                  <h2 className="text-3xl font-black mb-4 tracking-tighter leading-tight">Scale Your Vision</h2>
                  <p className="text-emerald-50/70 text-sm mb-12 font-medium leading-relaxed">Outsource tasks to global workers and focus on what matters.</p>
                  <button onClick={() => setIsEmployerPosting(true)} className="w-full py-5 bg-white text-emerald-700 font-black rounded-2xl shadow-xl hover:scale-[1.03] transition-all uppercase tracking-widest text-xs relative z-10">
                    Post New Gig
                  </button>
                </div>
             </div>
             <div className="md:col-span-2">
                <h3 className="text-xl font-black text-emerald-900 mb-8 tracking-tight">Active Deliverables</h3>
                <div className="space-y-6">
                   {availableJobs.filter(j => j.employerId === user.id && j.status === 'SUBMITTED').map(job => (
                     <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-right-4">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Worker Submission</p>
                             <h4 className="font-black text-xl text-emerald-900">{job.title}</h4>
                           </div>
                           <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black text-sm">Rp {job.reward.toLocaleString()}</span>
                        </div>
                        <div className="bg-emerald-50/30 p-6 rounded-2xl mb-8 border border-emerald-50 border-dashed">
                          <p className="text-emerald-900/70 text-sm italic font-medium">"{job.submissionText}"</p>
                        </div>
                        <div className="flex gap-4">
                           <button onClick={() => approveJob(job)} className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">Release Funds</button>
                           <button className="px-6 py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl text-xs uppercase tracking-widest">Reject</button>
                        </div>
                     </div>
                   ))}
                   {availableJobs.filter(j => j.employerId === user.id && j.status === 'SUBMITTED').length === 0 && (
                     <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-emerald-100 text-emerald-200">
                        <i className="fas fa-tasks text-4xl mb-4"></i>
                        <p className="font-black uppercase text-xs tracking-widest">No pending reviews</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Task Execution Modal */}
      {activeJob && (
        <div className="fixed inset-0 bg-emerald-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom-12 duration-300">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100 px-3 py-1 rounded-full">Active Mission</span>
                   <h3 className="text-3xl font-black text-emerald-900 mt-2 tracking-tighter">{activeJob.title}</h3>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">Contract Value</p>
                   <p className="text-2xl font-black text-emerald-600">Rp {activeJob.reward.toLocaleString()}</p>
                </div>
             </div>
             
             <div className="flex gap-6 mb-8 text-[10px] text-emerald-900/40 font-black uppercase tracking-widest">
                <span className="flex items-center gap-2"><i className="fas fa-map-marker-alt"></i>{activeJob.location}</span>
                <span className="flex items-center gap-2"><i className="fas fa-hourglass-half"></i>{activeJob.timeLimit}</span>
             </div>

             <p className="bg-emerald-50/50 p-8 rounded-[2rem] mb-10 text-sm text-emerald-900/60 leading-relaxed font-medium">{activeJob.description}</p>
             
             <div className="mb-10">
                <label className="block text-xs font-black text-emerald-600 mb-4 uppercase tracking-widest">Final Submission Output</label>
                <textarea 
                  value={submission} 
                  onChange={e => setSubmission(e.target.value)} 
                  className="w-full h-44 bg-emerald-50/20 border-2 border-emerald-100 rounded-[2rem] p-8 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-600 outline-none resize-none font-bold text-emerald-900 placeholder:text-emerald-200"
                  placeholder="Paste your code, links to designs, or summary of work here..."
                ></textarea>
             </div>

             <div className="flex gap-4">
                <button onClick={() => setActiveJob(null)} className="flex-1 py-5 bg-gray-50 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-[10px]">Cancel Project</button>
                <button 
                  onClick={handleSubmission}
                  disabled={isSubmitting || !submission.trim()}
                  className="flex-[2] py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                >
                  {isSubmitting ? 'Validating Proof of Work...' : 'Submit Deliverable'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* New Gig Creation Modal */}
      {isEmployerPosting && (
        <div className="fixed inset-0 bg-emerald-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
              <h3 className="text-3xl font-black text-emerald-900 mb-10 tracking-tight">Launch a Campaign</h3>
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-black text-emerald-600 mb-2 uppercase tracking-widest">Project Name</label>
                       <input 
                         type="text" 
                         value={newJobForm.title} 
                         onChange={e => setNewJobForm(p => ({ ...p, title: e.target.value }))} 
                         className="w-full px-5 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl font-bold text-emerald-900" 
                         placeholder="E.g. Fullstack Dev" 
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-black text-emerald-600 mb-2 uppercase tracking-widest">Bounty (IDR)</label>
                       <input 
                         type="number" 
                         value={newJobForm.reward} 
                         onChange={e => setNewJobForm(p => ({ ...p, reward: Number(e.target.value) }))} 
                         className="w-full px-5 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl font-bold text-emerald-900" 
                       />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-black text-emerald-600 mb-2 uppercase tracking-widest">Location</label>
                       <input 
                         type="text" 
                         value={newJobForm.location} 
                         onChange={e => setNewJobForm(p => ({ ...p, location: e.target.value }))} 
                         className="w-full px-5 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl font-bold text-emerald-900" 
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-black text-emerald-600 mb-2 uppercase tracking-widest">Time Window</label>
                       <select 
                         value={newJobForm.timeLimit} 
                         onChange={e => setNewJobForm(p => ({ ...p, timeLimit: e.target.value }))} 
                         className="w-full px-5 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl font-bold text-emerald-900 outline-none"
                       >
                          <option>1 Hour</option>
                          <option>24 Hours</option>
                          <option>72 Hours</option>
                       </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-emerald-600 mb-2 uppercase tracking-widest">Detailed Briefing</label>
                    <textarea 
                      value={newJobForm.description} 
                      onChange={e => setNewJobForm(p => ({ ...p, description: e.target.value }))} 
                      className="w-full h-32 bg-emerald-50/30 border border-emerald-100 rounded-2xl p-6 resize-none font-medium text-emerald-900" 
                      placeholder="Explain exactly what you need delivered..."
                    ></textarea>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsEmployerPosting(false)} className="flex-1 py-5 bg-gray-50 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-[10px]">Back</button>
                    <button onClick={postJobAsEmployer} className="flex-1 py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 uppercase tracking-widest text-[10px]">Authorize Gig</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
