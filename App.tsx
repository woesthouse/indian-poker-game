
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Player, GamePhase, ActionType, TranslationKey } from './types';
import PlayerInfo from './components/PlayerInfo';
import { translations } from './translations';

const INITIAL_CHIPS = 20;
const ANTE = 1;

// Creates a single deck of 20 cards (two of each number from 1 to 10)
const createSingleDeck = (): Card[] => {
  const singleDeck: Card[] = [];
  for (let i = 1; i <= 10; i++) {
    singleDeck.push({ value: i, id: `${i}-a` }); // Suffix 'a' for the first card of this value
    singleDeck.push({ value: i, id: `${i}-b` }); // Suffix 'b' for the second card of this value
  }
  return singleDeck;
};

const shuffleDeck = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'ko'>('en');

  const t = useCallback((key: TranslationKey, ...args: any[]): string => {
    const langSet = translations[language] || translations.en;
    const entry = langSet[key];
    if (typeof entry === 'function') {
      return entry(...args);
    }
    return entry || String(key);
  }, [language]);

  const [playerDeck, setPlayerDeck] = useState<Card[]>(shuffleDeck(createSingleDeck()));
  const [aiDeck, setAiDeck] = useState<Card[]>(shuffleDeck(createSingleDeck()));

  const [player, setPlayer] = useState<Player>({ id: 'player', name: t('playerName'), chips: INITIAL_CHIPS, card: null, currentBetInRound: 0 });
  const [ai, setAi] = useState<Player>({ id: 'ai', name: t('aiName'), chips: INITIAL_CHIPS, card: null, currentBetInRound: 0 });
  
  const [pot, setPot] = useState<number>(0);
  const [carryOverPot, setCarryOverPot] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.START_MENU);
  const [activePlayerId, setActivePlayerId] = useState<'player' | 'ai'>('player');
  
  const [messageKey, setMessageKey] = useState<TranslationKey | null>('welcomeMessage');
  const [messageArgs, setMessageArgs] = useState<any[]>([]);
  
  const [betToCall, setBetToCall] = useState<number>(0);
  const [raiseAmount, setRaiseAmount] = useState<string>('2');
  const [numberOfChecksInARow, setNumberOfChecksInARow] = useState<number>(0);
  const [showPlayerCardValue, setShowPlayerCardValue] = useState<boolean>(false);

  useEffect(() => {
    const currentTranslations = translations[language] || translations.en;
    setPlayer(prev => ({ ...prev, name: currentTranslations.playerName }));
    setAi(prev => ({ ...prev, name: currentTranslations.aiName }));

    if (gamePhase === GamePhase.START_MENU) {
      setMessageKey('welcomeMessage');
      setMessageArgs([]);
    }
  }, [language, gamePhase]);


  const startNewGame = useCallback(() => {
    const currentTranslations = translations[language] || translations.en;
    setPlayerDeck(shuffleDeck(createSingleDeck()));
    setAiDeck(shuffleDeck(createSingleDeck()));
    setPlayer({ id: 'player', name: currentTranslations.playerName, chips: INITIAL_CHIPS, card: null, currentBetInRound: 0 });
    setAi({ id: 'ai', name: currentTranslations.aiName, chips: INITIAL_CHIPS, card: null, currentBetInRound: 0 });
    setPot(0);
    setCarryOverPot(0);
    setGamePhase(GamePhase.DEALING);
    setMessageKey('newGameStarted');
    setMessageArgs([]);
    setShowPlayerCardValue(false);
  }, [language]);

  const startNewRound = useCallback(() => {
    if (player.chips <= 0 || ai.chips <= 0) {
      setGamePhase(GamePhase.GAME_OVER);
      setMessageKey(player.chips <= 0 ? 'aiWinsGame' : 'youWinGame');
      setMessageArgs([]);
      return;
    }
    setShowPlayerCardValue(false);

    let currentPDeck = [...playerDeck];
    let currentAiDeck = [...aiDeck];

    if (currentPDeck.length === 0) {
      console.log("Player deck reshuffled");
      currentPDeck = shuffleDeck(createSingleDeck());
    }
    if (currentAiDeck.length === 0) {
      console.log("AI deck reshuffled");
      currentAiDeck = shuffleDeck(createSingleDeck());
    }

    const playerCard = currentPDeck.pop()!;
    const aiCard = currentAiDeck.pop()!;
    
    setPlayerDeck(currentPDeck);
    setAiDeck(currentAiDeck);

    const playerNewChips = player.chips - ANTE;
    const aiNewChips = ai.chips - ANTE;

    if (playerNewChips < 0 || aiNewChips < 0) {
        setGamePhase(GamePhase.GAME_OVER);
        setMessageKey(playerNewChips < 0 ? 'aiWinsGame' : 'youWinGame');
        setMessageArgs([]);
        return;
    }
    
    setPlayer(prev => ({ ...prev, card: playerCard, chips: playerNewChips, currentBetInRound: ANTE }));
    setAi(prev => ({ ...prev, card: aiCard, chips: aiNewChips, currentBetInRound: ANTE }));
    
    const newPot = ANTE * 2 + carryOverPot;
    setPot(newPot);
    setCarryOverPot(0); // Carry-over is now part of the new pot
    
    setActivePlayerId('player'); 
    setBetToCall(0); 
    setNumberOfChecksInARow(0);
    setGamePhase(GamePhase.BETTING);
    
    setMessageKey('antePaidPotTurnMessage');
    setMessageArgs([newPot, t('yourTurn'), t('check'), t('bet')]);

  }, [playerDeck, aiDeck, player.chips, ai.chips, carryOverPot, language, t]);

  useEffect(() => {
    if (gamePhase === GamePhase.DEALING) {
      setMessageKey('dealingCards');
      setMessageArgs([]);
      const timer = setTimeout(startNewRound, 1500); 
      return () => clearTimeout(timer);
    }
  }, [gamePhase, startNewRound]);

  const handleAction = useCallback((actionType: ActionType, amount?: number) => {
    if (gamePhase !== GamePhase.BETTING) return;

    const currentPlayer = activePlayerId === 'player' ? player : ai;
    const opponent = activePlayerId === 'player' ? ai : player;
    
    let nextPlayerChips = currentPlayer.chips;
    let nextPot = pot;
    let nextCurrentPlayerBet = currentPlayer.currentBetInRound;
    let nextBetToCall = betToCall;
    let nextGamePhase: GamePhase = gamePhase;
    let nextMessageKey: TranslationKey | null = messageKey;
    let nextMessageArgs: any[] = messageArgs;
    let nextActivePlayerId = activePlayerId;
    let nextNumberOfChecks = numberOfChecksInARow;
    let awardedPotOnFold = pot; // pot value at the moment of folding

    if (actionType === 'fold') {
      const isPenaltyFold = currentPlayer.card?.value === 10;
      let chipsPaidAsPenalty = 0;
      
      if (isPenaltyFold) {
        chipsPaidAsPenalty = Math.min(currentPlayer.chips, 10);
        nextPlayerChips = currentPlayer.chips - chipsPaidAsPenalty;
        awardedPotOnFold += chipsPaidAsPenalty; // Opponent gets original pot + penalty

        if (currentPlayer.id === 'player') {
          setShowPlayerCardValue(true); 
        }
        nextMessageKey = 'playerFoldsWithPenalty';
        nextMessageArgs = [currentPlayer.name, opponent.name, pot, chipsPaidAsPenalty]; // pot here is the original pot before penalty
      } else {
        nextPlayerChips = currentPlayer.chips; // No change if no penalty other than losing the pot
        nextMessageKey = 'playerFolds';
        nextMessageArgs = [currentPlayer.name, opponent.name, pot];
      }

      if (opponent.id === 'player') {
        setPlayer(prev => ({...prev, chips: prev.chips + awardedPotOnFold, currentBetInRound: 0}));
      } else {
        setAi(prev => ({...prev, chips: prev.chips + awardedPotOnFold, currentBetInRound: 0}));
      }
      
      // Update current player's state (who folded)
      if (currentPlayer.id === 'player') {
         setPlayer(prev => ({ ...prev, chips: nextPlayerChips, currentBetInRound: 0 }));
      } else {
         setAi(prev => ({ ...prev, chips: nextPlayerChips, currentBetInRound: 0 }));
      }
      
      setPot(0); // Pot is awarded and now empty for the next round setup.
      nextGamePhase = GamePhase.ROUND_OVER;

    } else if (actionType === 'check_call') {
      const payment = betToCall; 
      if (currentPlayer.chips < payment) { 
        return handleAction('fold'); 
      }
      nextPlayerChips -= payment;
      nextPot += payment;
      nextCurrentPlayerBet += payment; 
      
      nextNumberOfChecks = payment > 0 ? 0 : nextNumberOfChecks + 1;

      if (payment > 0) { 
        nextMessageKey = 'playerCalls';
        nextMessageArgs = [currentPlayer.name, payment];
        nextGamePhase = GamePhase.SHOWDOWN; 
      } else { 
        nextMessageKey = 'playerChecks';
        nextMessageArgs = [currentPlayer.name];
        if (nextNumberOfChecks >= 2 && player.currentBetInRound === ai.currentBetInRound ) {
          nextMessageKey = 'bothCheckShowdown'; 
          nextMessageArgs = []; 
          nextGamePhase = GamePhase.SHOWDOWN;
        } else {
          nextActivePlayerId = opponent.id;
          nextBetToCall = 0; 
        }
      }
    } else if (actionType === 'bet_raise' && amount !== undefined) {
      const costToPlayer = amount - currentPlayer.currentBetInRound; 
      
      let minValidTotalBetAmount: number;
       if (betToCall > 0) { 
           minValidTotalBetAmount = opponent.currentBetInRound + ANTE;
       } else { 
           minValidTotalBetAmount = currentPlayer.currentBetInRound + ANTE;
       }

      if (costToPlayer <= 0) { 
         nextMessageKey = 'betRaiseAmountError'; 
         nextMessageArgs = [];
      } else if (amount < minValidTotalBetAmount) {
         nextMessageKey = 'raiseAmountTooLowError';
         nextMessageArgs = [minValidTotalBetAmount];
      } else if (currentPlayer.chips < costToPlayer) {
        nextMessageKey = 'notEnoughChipsBetRaise';
        nextMessageArgs = [currentPlayer.name, amount];
      } else { 
        nextPlayerChips -= costToPlayer;
        nextPot += costToPlayer;
        nextCurrentPlayerBet = amount; 
        
        const actionStr = (betToCall > 0 || opponent.currentBetInRound > currentPlayer.currentBetInRound) ? t('raiseTo') : t('bet');
        nextMessageKey = 'playerBetsOrRaises';
        nextMessageArgs = [currentPlayer.name, actionStr, amount];
        
        nextActivePlayerId = opponent.id;
        nextBetToCall = nextCurrentPlayerBet - opponent.currentBetInRound; 
        nextNumberOfChecks = 0; 
      }
    }
    
    if (activePlayerId === 'player') {
        setPlayer(prev => ({ ...prev, chips: nextPlayerChips, currentBetInRound: nextCurrentPlayerBet }));
    } else {
        setAi(prev => ({ ...prev, chips: nextPlayerChips, currentBetInRound: nextCurrentPlayerBet }));
    }

    setPot(nextPot); 
    setGamePhase(nextGamePhase);
    if (nextMessageKey) setMessageKey(nextMessageKey); 
    setMessageArgs(nextMessageArgs);
    setActivePlayerId(nextActivePlayerId);
    setBetToCall(nextBetToCall);
    setNumberOfChecksInARow(nextNumberOfChecks);

    if (nextGamePhase === GamePhase.SHOWDOWN) {
      setShowPlayerCardValue(true);
    }
  }, [gamePhase, activePlayerId, player, ai, pot, betToCall, numberOfChecksInARow, t]);


  useEffect(() => {
    if (gamePhase === GamePhase.BETTING) {
      const currentTurnPlayerObject = activePlayerId === 'player' ? player : ai;
      const turnPlayerName = currentTurnPlayerObject.name;
      
      let msgKey: TranslationKey = 'opponentTurnInfo'; 
      let msgArgs: any[] = [turnPlayerName, t('check'), t('bet')];

      if (activePlayerId === 'player') { 
        if (betToCall > 0) {
          msgKey = 'opponentTurnCallRaise'; 
          msgArgs = [t('yourTurn'), betToCall, t('raiseTo')]; 
        } else {
          msgKey = 'opponentTurnInfo';
          msgArgs = [t('yourTurn'), t('check'), t('bet')];
        }
      } else { 
        if (betToCall > 0) {
          msgKey = 'opponentTurnCallRaise';
          msgArgs = [ai.name, betToCall, t('raiseTo')];
        } else {
          msgKey = 'opponentTurnInfo';
          msgArgs = [ai.name, t('check'), t('bet')];
        }
      }
      // Only set message if it's different or args are different to avoid potential loop if deps are not exhaustive
      if (messageKey !== msgKey || JSON.stringify(messageArgs) !== JSON.stringify(msgArgs)) {
        setMessageKey(msgKey);
        setMessageArgs(msgArgs);
      }
    }
  }, [activePlayerId, gamePhase, betToCall, player.name, ai.name, t, language, messageKey, messageArgs]);


  useEffect(() => {
    if (gamePhase === GamePhase.BETTING && activePlayerId === 'ai') {
      const aiDecisionTimeout = setTimeout(() => {
        if (!player.card || !ai.card) { 
            console.error("AI or Player card missing for AI decision");
            return; 
        }

        const playerVisibleCardValue = player.card.value; 
        
        let action: ActionType;
        let betAmount: number | undefined;

        if (betToCall > 0) { 
          if (playerVisibleCardValue >= 8) { 
            if (betToCall > ai.chips * 0.3 && Math.random() < 0.7) action = 'fold';
            else action = 'check_call';
          } else if (playerVisibleCardValue <= 4) { 
            if (ai.chips >= betToCall + ANTE && Math.random() < 0.5) {
              action = 'bet_raise';
              betAmount = player.currentBetInRound + ANTE + Math.floor(Math.random() * ANTE);
            } else {
              action = 'check_call';
            }
          } else { 
            if (betToCall > ai.chips * 0.2 && Math.random() < 0.5) action = 'fold';
            else action = 'check_call';
          }
        } else { 
          if (playerVisibleCardValue <= 4) { 
            if (Math.random() < 0.6) {
              action = 'bet_raise';
              betAmount = ai.currentBetInRound + ANTE + Math.floor(Math.random() * Math.max(ANTE, pot * 0.15));
            } else action = 'check_call';
          } else if (playerVisibleCardValue >= 7) { 
             if (Math.random() < 0.15) { 
                action = 'bet_raise';
                betAmount = ai.currentBetInRound + ANTE;
             } else action = 'check_call';
          } else { 
            if (Math.random() < 0.3) {
                action = 'bet_raise';
                betAmount = ai.currentBetInRound + ANTE;
            } else action = 'check_call';
          }
        }
        
        if (action === 'bet_raise') {
            const costToAI = (betAmount || 0) - ai.currentBetInRound;
            const minTotalAIRaise = (player.currentBetInRound > ai.currentBetInRound) 
                                  ? player.currentBetInRound + ANTE 
                                  : ai.currentBetInRound + ANTE;

            if (!betAmount || costToAI <=0 || (betAmount || 0) < minTotalAIRaise || costToAI > ai.chips) {
                action = 'check_call'; 
                if (betToCall > 0 && betToCall > ai.chips) { 
                    action = 'fold'; 
                }
                betAmount = undefined;
            }
        }
        handleAction(action, betAmount);
      }, 1500 + Math.random() * 1000); 
      return () => clearTimeout(aiDecisionTimeout);
    }
  }, [gamePhase, activePlayerId, ai, player, pot, betToCall, handleAction, t]); 

  useEffect(() => {
    if (gamePhase === GamePhase.SHOWDOWN) {
      setShowPlayerCardValue(true); 
      if (!player.card || !ai.card) {
        console.error("Cards missing for showdown");
        setGamePhase(GamePhase.ROUND_OVER); 
        setMessageKey('error'); 
        setMessageArgs(['Card error during showdown.']);
        return;
      }

      const playerCardValue = player.card.value;
      const aiCardValue = ai.card.value; 
      
      let roundMessageKey: TranslationKey = 'tieCarryOver'; 
      let roundMessageArgs: any[] = [pot]; // Capture pot value for the message BEFORE it's potentially reset

      if (playerCardValue > aiCardValue) {
        setPlayer(prev => ({ ...prev, chips: prev.chips + pot, currentBetInRound: 0 }));
        setAi(prev => ({ ...prev, currentBetInRound: 0})); 
        roundMessageKey = 'youWinPot';
        roundMessageArgs = [pot];
      } else if (aiCardValue > playerCardValue) {
        setAi(prev => ({ ...prev, chips: prev.chips + pot, currentBetInRound: 0 }));
        setPlayer(prev => ({ ...prev, currentBetInRound: 0})); 
        roundMessageKey = 'aiWinsPot';
        roundMessageArgs = [pot];
      } else { // Tie
        setCarryOverPot(prevCarryOver => prevCarryOver + pot); // Add current pot to carryOverPot
        // Bets are cleared from players, they were part of the pot that now carries over
        setPlayer(prev => ({ ...prev, currentBetInRound: 0}));
        setAi(prev => ({ ...prev, currentBetInRound: 0}));
        roundMessageKey = 'tieCarryOver';
        roundMessageArgs = [pot]; // Message still refers to the pot amount of THIS round
      }
      // DO NOT setPot(0) here. The pot value should persist visually until the next round starts.
      
      setMessageKey(roundMessageKey);
      setMessageArgs(roundMessageArgs); 
      
      const timer = setTimeout(() => setGamePhase(GamePhase.ROUND_OVER), 3000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, player.card, ai.card, pot, t]); // pot is a dependency here to correctly capture its value for messages


  const LanguageSelector = () => (
    <div className="absolute top-2 right-2 md:top-4 md:right-4 flex space-x-1 md:space-x-2 z-20">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm transition-colors duration-150 ${language === 'en' ? 'bg-amber-500 text-white font-semibold' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
      >
        English
      </button>
      <button
        onClick={() => setLanguage('ko')}
        className={`px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm transition-colors duration-150 ${language === 'ko' ? 'bg-amber-500 text-white font-semibold' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
      >
        한국어
      </button>
    </div>
  );

  const renderControls = () => {
    if (gamePhase !== GamePhase.BETTING || activePlayerId !== 'player') return null;

    const canCheck = betToCall === 0;
    
    let minTotalBetOrRaiseAmountRequired: number;
    if (betToCall > 0) { 
      minTotalBetOrRaiseAmountRequired = ai.currentBetInRound + ANTE;
    } else { 
      minTotalBetOrRaiseAmountRequired = player.currentBetInRound + ANTE;
    }
    
    const currentRaiseAmountState = parseInt(raiseAmount, 10);
    const displayRaiseAmount = isNaN(currentRaiseAmountState) || currentRaiseAmountState < minTotalBetOrRaiseAmountRequired 
                               ? String(minTotalBetOrRaiseAmountRequired) 
                               : raiseAmount;


    const targetBetAmountForAction = parseInt(raiseAmount, 10);
    const costOfBetRaiseAction = isNaN(targetBetAmountForAction) ? 0 : targetBetAmountForAction - player.currentBetInRound;
    
    const isValidBetRaiseInput = !isNaN(targetBetAmountForAction) && 
                               targetBetAmountForAction >= minTotalBetOrRaiseAmountRequired &&
                               costOfBetRaiseAction > 0; 

    const canAffordBetRaise = player.chips >= costOfBetRaiseAction;


    return (
      <div className="mt-6 p-4 bg-gray-700 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-3 text-center">{t('yourActions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            onClick={() => handleAction('fold')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out transform hover:scale-105"
            aria-label={t('fold')}
          >
            {t('fold')}
          </button>
          <button 
            onClick={() => handleAction('check_call')}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out transform hover:scale-105"
            disabled={player.chips < betToCall} 
            aria-label={canCheck ? t('check') : t('callButtonText', betToCall)}
          >
            {canCheck ? t('check') : t('callButtonText', betToCall)}
          </button>
          <div className="flex flex-col items-center md:flex-row md:items-stretch gap-2">
            <input 
              type="number"
              value={displayRaiseAmount} 
              onChange={(e) => {
                const val = e.target.value;
                // Allow empty input or valid numbers
                if (val === "" || /^[0-9]+$/.test(val)) {
                   setRaiseAmount(val);
                }
              }}
              onBlur={() => { // Ensure value is at least min when focus is lost if current value is too low or invalid
                const numVal = parseInt(raiseAmount, 10);
                if (isNaN(numVal) || numVal < minTotalBetOrRaiseAmountRequired) {
                  setRaiseAmount(String(minTotalBetOrRaiseAmountRequired));
                }
              }}
              min={minTotalBetOrRaiseAmountRequired} 
              placeholder={t('betAmountPlaceholder')}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg py-3 px-3 w-full md:w-2/3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none appearance-none"
              style={{ MozAppearance: 'textfield' }} 
            />
            <button 
              onClick={() => handleAction('bet_raise', parseInt(raiseAmount,10))}
              disabled={!isValidBetRaiseInput || !canAffordBetRaise}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out transform hover:scale-105 flex-grow"
              aria-label={t('betButtonText', (betToCall > 0 || (ai.currentBetInRound > player.currentBetInRound && player.currentBetInRound > 0) ? t('raiseTo') : t('bet')), raiseAmount)}
            >
              {t('betButtonText', (betToCall > 0 || (ai.currentBetInRound > player.currentBetInRound && player.currentBetInRound > 0) ? t('raiseTo') : t('bet')), raiseAmount)}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const displayedMessage = messageKey ? t(messageKey, ...messageArgs) : "";

  if (gamePhase === GamePhase.START_MENU) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
        <LanguageSelector />
        <h1 className="text-5xl font-bold mb-8 text-amber-400">{t('indianPokerTitle')}</h1>
        <p className="text-xl mb-12 text-center max-w-md">
          {t('seeOpponentCard')}
        </p>
        <button 
          onClick={startNewGame}
          className="bg-green-500 hover:bg-green-600 text-white font-extrabold py-4 px-10 text-2xl rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105"
        >
          {t('startGame')}
        </button>
      </div>
    );
  }
  
  if (gamePhase === GamePhase.GAME_OVER) {
     return (
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
        <LanguageSelector />
        <h1 className="text-5xl font-bold mb-8 text-red-500">{t('gameOver')}</h1>
        <p className="text-2xl mb-12 text-center">{displayedMessage}</p>
        <button 
          onClick={startNewGame}
          className="bg-blue-500 hover:bg-blue-600 text-white font-extrabold py-4 px-10 text-2xl rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105"
        >
          {t('playAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 pt-16 md:pt-10"> 
      <LanguageSelector />
      <div className="bg-gray-800 shadow-2xl rounded-xl p-4 md:p-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-amber-400 tracking-tight">{t('indianPokerTitle')}</h1>
          <p className="text-lg text-gray-300 mt-1">
            {t('pot')}: <span className="chip-icon"></span><span className="font-semibold text-xl text-yellow-300">{pot}</span>
            {carryOverPot > 0 && <span className="text-sm text-gray-400"> ({t('carryOver')}: {carryOverPot})</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <PlayerInfo player={ai} isPlayerTurn={activePlayerId === 'ai'} t={t} />
          <PlayerInfo player={player} isPlayerTurn={activePlayerId === 'player'} showPlayerCardValue={showPlayerCardValue} t={t} />
        </div>
        
        <div className="my-6 p-4 bg-gray-700 rounded-lg shadow-inner min-h-[60px] flex items-center justify-center">
          <p className="text-lg text-center italic text-sky-200">{displayedMessage}</p>
        </div>

        {renderControls()}

        {(gamePhase === GamePhase.ROUND_OVER) && (
          <div className="text-center mt-8">
            <button 
              onClick={startNewRound}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 text-lg rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
            >
              {t('nextRound')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
