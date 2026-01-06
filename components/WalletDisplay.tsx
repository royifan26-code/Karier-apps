
import React, { useState } from 'react';
import { Wallet, Transaction } from '../types';

interface WalletDisplayProps {
  wallet: Wallet;
  onDeposit: (amount: number, method: 'GOPAY' | 'OVO') => void;
}

const WalletDisplay: React.FC<WalletDisplayProps> = ({ wallet, onDeposit }) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(100000);
  const [paymentMethod, setPaymentMethod] = useState<'GOPAY' | 'OVO'>('GOPAY');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDepositSubmit = () => {
    if (depositAmount < 100000) {
      alert("Minimum deposit is Rp 100.000");
      return;
    }
    onDeposit(depositAmount, paymentMethod);
    setIsDepositModalOpen(false);
  };

  const getTransactionStyles = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return {
          icon: 'fa-arrow-down',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          label: 'Deposit'
        };
      case 'EARNING':
        return {
          icon: 'fa-coins',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          label: 'Earning'
        };
      case 'PAYMENT':
        return {
          icon: 'fa-arrow-up',
          color: 'text-rose-600',
          bg: 'bg-rose-50',
          label: 'Payment'
        };
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Balance Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wider">Total Balance</p>
            <h2 className="text-3xl font-bold text-gray-900">{formatCurrency(wallet.balance)}</h2>
          </div>
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
          >
            <i className="fas fa-wallet"></i>
            Top Up
          </button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <i className="fas fa-history text-emerald-500 text-sm"></i>
          Transaction History
        </h3>
        
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {wallet.transactions.length > 0 ? (
            wallet.transactions.map((tx) => {
              const styles = getTransactionStyles(tx.type);
              return (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-emerald-50/30 transition-colors border border-transparent hover:border-emerald-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${styles.bg} ${styles.color} rounded-xl flex items-center justify-center`}>
                      <i className={`fas ${styles.icon}`}></i>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{tx.description}</p>
                      <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{styles.label}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <i className="fas fa-receipt text-2xl"></i>
              </div>
              <p className="text-gray-400 font-medium text-sm">No transaction history found</p>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-emerald-50 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Add Funds</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Amount (Min: Rp 100.000)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">Rp</span>
                  <input
                    type="number"
                    min="100000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900"
                    placeholder="100,000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Payment Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('GOPAY')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'GOPAY' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-gray-100 hover:border-emerald-200 text-gray-400'
                    }`}
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                       <i className="fas fa-wallet text-emerald-600 text-xl"></i>
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest">GoPay</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('OVO')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'OVO' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-gray-100 hover:border-emerald-200 text-gray-400'
                    }`}
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <i className="fas fa-mobile-alt text-emerald-600 text-xl"></i>
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest">OVO</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsDepositModalOpen(false)}
                  className="flex-1 px-4 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDepositSubmit}
                  className="flex-1 px-4 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 uppercase text-xs tracking-widest"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDisplay;
