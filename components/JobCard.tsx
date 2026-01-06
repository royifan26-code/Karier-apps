
import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onApply: (job: Job) => void;
  isApplying?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, isApplying }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-100 text-emerald-700';
      case 'Medium': return 'bg-amber-100 text-amber-700';
      case 'Hard': return 'bg-rose-100 text-rose-700';
      default: return 'bg-emerald-50 text-emerald-900';
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-50 hover:shadow-2xl hover:shadow-emerald-100 hover:scale-[1.01] transition-all flex flex-col h-full group">
      <div className="flex justify-between items-center mb-6">
        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl uppercase tracking-widest border border-emerald-100">
          {job.category}
        </span>
        <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${getDifficultyColor(job.difficulty)}`}>
          {job.difficulty}
        </span>
      </div>
      
      {job.imageUrl && (
        <div className="mb-6 rounded-[1.5rem] overflow-hidden h-40 bg-emerald-50 shadow-inner">
           <img src={job.imageUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        </div>
      )}
      
      <h3 className="text-xl font-black text-emerald-900 mb-3 leading-tight tracking-tight group-hover:text-emerald-600 transition-colors">{job.title}</h3>
      <p className="text-emerald-900/50 text-sm font-medium line-clamp-3 mb-6 flex-grow leading-relaxed">{job.description}</p>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">
          <i className="fas fa-map-marker-alt text-emerald-200"></i>
          {job.location}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">
          <i className="fas fa-clock text-emerald-200"></i>
          {job.timeLimit}
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-emerald-50 mt-auto">
        <div>
          <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest mb-1">Bounty</p>
          <p className="text-lg font-black text-emerald-600 leading-none">{formatCurrency(job.reward)}</p>
        </div>
        <button
          onClick={() => onApply(job)}
          disabled={isApplying || job.status !== 'OPEN'}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 disabled:bg-emerald-50 disabled:text-emerald-200 disabled:shadow-none"
        >
          {job.status === 'OPEN' ? 'Take Gig' : job.status}
        </button>
      </div>
    </div>
  );
};

export default JobCard;
