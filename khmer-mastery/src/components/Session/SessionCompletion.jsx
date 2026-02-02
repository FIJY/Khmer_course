import React from 'react';
import { Frown, Trophy } from 'lucide-react';
import MobileLayout from '../Layout/MobileLayout';
import Button from '../UI/Button';

const SessionCompletion = ({
  variant = 'success',
  title,
  description,
  score,
  total,
  actionLabel,
  onAction
}) => {
  const isSuccess = variant === 'success';
  const isFailure = !isSuccess;
  const icon = isSuccess ? (
    <Trophy size={80} className="text-emerald-400 mb-8 animate-bounce" />
  ) : (
    <Frown size={80} className="text-red-500 mb-8" />
  );

  return (
    <MobileLayout withNav={!isFailure}>
      <div className={`${isFailure ? 'fixed inset-0' : 'flex-1'} flex flex-col items-center justify-center p-8 text-center`}>
        {icon}
        <h1 className={`text-4xl font-black italic uppercase mb-2 ${isSuccess ? 'text-white' : 'text-white'}`}>{title}</h1>
        {typeof score === 'number' && typeof total === 'number' && (
          <p className="text-gray-400 mb-8 text-xl font-bold">
            {description ?? `${score} / ${total}`}
          </p>
        )}
        {actionLabel && onAction && (
          <Button
            variant={isSuccess ? 'primary' : 'danger'}
            onClick={onAction}
            className={isFailure ? 'w-auto px-10' : ''}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </MobileLayout>
  );
};

export default SessionCompletion;
