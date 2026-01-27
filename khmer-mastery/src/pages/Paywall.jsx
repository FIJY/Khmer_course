import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Gift, QrCode, ShieldCheck } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';
import {
  FREE_LESSON_COUNT,
  TOTAL_LESSON_COUNT,
  redeemGiftCode,
  setPaidAccess
} from '../lib/access';

export default function Paywall() {
  const navigate = useNavigate();
  const location = useLocation();
  const [giftCode, setGiftCode] = useState('');
  const [giftError, setGiftError] = useState('');
  const qrUrl = import.meta.env.VITE_ABA_QR_URL;

  const returnTarget = useMemo(() => location.state?.from ?? '/map', [location.state]);

  const handlePaymentConfirm = () => {
    setPaidAccess({ source: 'aba' });
    navigate(returnTarget);
  };

  const handleGiftRedeem = () => {
    const result = redeemGiftCode(giftCode);
    if (!result.ok) {
      setGiftError(result.message);
      return;
    }
    setGiftError('');
    navigate(returnTarget);
  };

  return (
    <MobileLayout withNav={false}>
      <div className="p-6 pt-10 space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-black italic uppercase text-white">Unlock the full course</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            {FREE_LESSON_COUNT} lessons free • {TOTAL_LESSON_COUNT} lessons total
          </p>
        </div>

        <div className="bg-gray-900/60 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <QrCode size={22} className="text-cyan-400" />
            <div>
              <p className="text-white font-black uppercase text-xs tracking-widest">Pay via ABA</p>
              <p className="text-[11px] text-gray-500">Scan the QR and confirm your payment.</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/5 bg-black/60 p-4 flex items-center justify-center">
            {qrUrl ? (
              <img src={qrUrl} alt="ABA QR payment" className="w-48 h-48 object-contain" />
            ) : (
              <div className="w-48 h-48 flex flex-col items-center justify-center text-gray-500 text-xs uppercase tracking-widest">
                <QrCode size={48} className="mb-3" />
                ABA QR placeholder
              </div>
            )}
          </div>
          <Button onClick={handlePaymentConfirm} className="w-full">
            <ShieldCheck size={18} /> I have paid
          </Button>
        </div>

        <div className="bg-gray-900/60 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Gift size={22} className="text-amber-400" />
            <div>
              <p className="text-white font-black uppercase text-xs tracking-widest">Gift card</p>
              <p className="text-[11px] text-gray-500">Enter a gift code to unlock instantly.</p>
            </div>
          </div>
          <input
            value={giftCode}
            onChange={(event) => {
              setGiftCode(event.target.value);
              if (giftError) setGiftError('');
            }}
            placeholder="ABA-GIFT-XXXX"
            className="w-full bg-black/70 text-white px-4 py-4 rounded-2xl border border-white/5 focus:border-amber-400 outline-none text-sm uppercase tracking-widest"
          />
          {giftError && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{giftError}</p>}
          <Button variant="outline" onClick={handleGiftRedeem} className="w-full">
            Redeem gift
          </Button>
        </div>

        <div className="text-center text-[10px] text-gray-600 uppercase tracking-[0.3em]">
          After payment we unlock all reading blocks and lessons.
        </div>
      </div>
    </MobileLayout>
  );
}
