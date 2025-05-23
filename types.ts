
export interface Card {
  value: number;
  id: string; // Unique ID for React keys, e.g., "7-1", "7-2"
}

export interface Player {
  id: 'player' | 'ai';
  name: string;
  chips: number;
  card: Card | null;
  currentBetInRound: number;
}

export enum GamePhase {
  START_MENU = 'START_MENU',
  DEALING = 'DEALING',
  BETTING = 'BETTING',
  SHOWDOWN = 'SHOWDOWN',
  ROUND_OVER = 'ROUND_OVER',
  GAME_OVER = 'GAME_OVER',
}

export type ActionType = 'fold' | 'check_call' | 'bet_raise';

// --- START OF LANGUAGE/TRANSLATION TYPES ---
export type TranslationFunction = (...args: any[]) => string;

export interface TranslationSet {
  indianPokerTitle: string;
  welcomeMessage: string;
  startGame: string;
  newGameStarted: string;
  yourTurn: string;
  aiTurn: string;
  check: string;
  call: string;
  bet: string;
  raiseTo: string;
  fold: string;
  antePaid: string;
  pot: string;
  carryOver: string;
  showdown: string;
  yourCard: string;
  aiCard: string;
  nextRound: string;
  gameOver: string;
  playAgain: string;
  yourActions: string;
  betAmountPlaceholder: string;
  seeOpponentCard: string;
  playerName: string;
  aiName: string;
  chipsLabel: string; // Added
  betLabel: string;   // Added
  antePaidPotTurnMessage: TranslationFunction; // e.g., (pot, turnMessage, action1, action2)
  playerFolds: TranslationFunction; // (playerName, opponentName, potAmount)
  playerFoldsWithPenalty: TranslationFunction; // (playerName, opponentName, potAmount, penaltyAmount)
  penaltyFold10: TranslationFunction; // (playerName) // This might be deprecated or combined into playerFoldsWithPenalty
  playerCalls: TranslationFunction; // (playerName, amount)
  playerChecks: TranslationFunction; // (playerName)
  bothCheckShowdown: string;
  opponentTurnInfo: TranslationFunction; // (opponentName, action1, action2)
  playerBetsOrRaises: TranslationFunction; // (playerName, actionString, amount) -> actionString will be "bets" or "raises to"
  opponentTurnCallRaise: TranslationFunction; // (opponentName, callAmount)
  notEnoughChipsBetRaise: TranslationFunction; // (playerName, amount)
  betRaiseAmountError: string;
  raiseAmountTooLowError: TranslationFunction; // (minAmount)
  youWinPot: TranslationFunction; // (potAmount)
  aiWinsPot: TranslationFunction; // (potAmount)
  tieCarryOver: TranslationFunction; // (potAmount)
  youWinGame: string;
  aiWinsGame: string;
  betButtonText: TranslationFunction; // (action, amount) -> "Bet 5" or "Raise to 10"
  callButtonText: TranslationFunction; // (amount) -> "Call 5"
  dealingCards: string;
  roundOverMessage: string; // Placeholder for a generic round over message if needed.
  // Fix: Add 'error' key for generic error messages
  error: TranslationFunction; // (errorMessage: string) => string;
}

export interface Translations {
  en: TranslationSet;
  ko: TranslationSet;
}

export type TranslationKey = keyof TranslationSet;
// --- END OF LANGUAGE/TRANSLATION TYPES ---