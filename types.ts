
export type UserRole = 'WORKER' | 'EMPLOYER';

export interface Wallet {
  balance: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'EARNING' | 'PAYMENT';
  amount: number;
  date: string;
  description: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  status: 'OPEN' | 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED';
  imageUrl?: string;
  location?: string;
  timeLimit?: string;
  employerId: string;
  workerId?: string;
  rating?: number;
  submissionText?: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  skills: string[];
  location: string;
  rating: number;
  jobsCompleted: number;
}

export interface UserState {
  id: string;
  role: UserRole | null;
  wallet: Wallet;
  careerLevel: number;
  experience: number;
  profile: UserProfile;
}
