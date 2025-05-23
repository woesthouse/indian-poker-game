
import React from 'react';
import { Card } from '../types';

interface CardDisplayProps {
  card: Card | null;
  revealed: boolean;
  isPlayerCard?: boolean;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ card, revealed, isPlayerCard }) => {
  const cardBaseClasses = "card transform transition-transform duration-500";
  const revealedFrontClasses = "card-front";
  const hiddenBackClasses = "card-back";

  if (!card) {
    return <div className={`${cardBaseClasses} ${hiddenBackClasses} opacity-50`}></div>;
  }

  return (
    <div className={`${cardBaseClasses} ${revealed || (isPlayerCard && !revealed) ? '' : 'rotate-y-180'}`}>
      {revealed ? (
        <div className={`${cardBaseClasses} ${revealedFrontClasses}`}>
          {card.value}
        </div>
      ) : (
        <div className={`${cardBaseClasses} ${hiddenBackClasses}`}>
          {isPlayerCard ? '?' : ''}
        </div>
      )}
    </div>
  );
};

export default CardDisplay;
    