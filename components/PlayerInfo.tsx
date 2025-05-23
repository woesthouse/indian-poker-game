import React from 'react';
import { Player as PlayerType, TranslationKey } from '../types';
import CardDisplay from './CardDisplay';

interface PlayerInfoProps {
  player: PlayerType;
  isPlayerTurn: boolean;
  showPlayerCardValue?: boolean; // For player's own card during showdown
  t: (key: TranslationKey, ...args: any[]) => string; // Added t function prop
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, isPlayerTurn, showPlayerCardValue, t }) => {
  const cardRevealed = player.id === 'ai' || (player.id === 'player' && showPlayerCardValue === true);

  return (
    <div className={`p-6 rounded-lg shadow-xl transition-all duration-300 ${isPlayerTurn ? 'border-4 border-amber-400 scale-105 bg-gray-700' : 'border-4 border-transparent bg-gray-800'}`}>
      <h2 className="text-2xl font-bold mb-3 text-center text-amber-300">{player.name}</h2>
      <div className="flex justify-center mb-4">
        <CardDisplay card={player.card} revealed={cardRevealed} isPlayerCard={player.id === 'player' && !showPlayerCardValue} />
      </div>
      <p className="text-xl text-center mb-2">
        <span className="chip-icon"></span> {t('chipsLabel')} {player.chips}
      </p>
      {player.currentBetInRound > 0 && (
        <p className="text-lg text-center text-sky-300">{t('betLabel')} {player.currentBetInRound}</p>
      )}
    </div>
  );
};

export default PlayerInfo;