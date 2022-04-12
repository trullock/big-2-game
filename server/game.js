const suits = [ 'D', 'H', 'C', 'S' ];
const numerics = [ 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K' ];

export default class Game
{
	#id = null;
	#name = null;
	#players = {}
	#playedHands = [];
	#currentPlayerIndex = null;
	#gameStarted = false;

	constructor(name, id)
	{
		this.#name = name;
		this.#id = id;
		
		this.#gameStarted = false;
	}

	get gameStarted()
	{
		return this.#gameStarted;
	}

	get currentPlayerId()
	{
		return this.#players[this.#currentPlayerIndex];
	}

	/// Adds a player to the game
	addPlayer(id, name, gameOwner)
	{
		if(this.#gameStarted)
			throw Error("Game already started");

		// TODO: prevent in-progress joining
		// TODO: limit to max-players
		this.#players[id] = {
			id,
			name,
			cards: [],
			gameOwner
		}
		let playersHands = this.#getPlayersHands();
		return Promise.resolve(playersHands);
	}

	/// Deals all cards + numJokers to all players, starting with the given dealer (or by randomly choosing a dealer)
	deal(numJokers, dealerPlayerId = null)
	{
		if(this.#gameStarted)
			throw Error("Game already started");

		// TODO: prevent double dealing
		let deck = this.#buildDeck(numJokers);
		this.#chooseDealer(dealerPlayerId);
		this.#dealDeck(deck, dealerPlayerId);
		let playersHands = this.#getPlayersHands();
		this.#gameStarted = true;
		return Promise.resolve(playersHands);
	}

	/// Builds a shuffled deck of 52 + numJokers cards
	#buildDeck(numJokers)
	{
		let deck = [];
		for(let i = 0; i < 13; i++)
		{
			for(let suit = 0; suit < 4; suit++)
				deck.push(numerics[i] + suits[suit]);
		}

		for(let j = 0; j < numJokers; j++)
			deck.push('??');

		deck = this.#shuffleDeck(deck);

		return deck;
	}

	/// Shuffles the given deck
	#shuffleDeck(deck)
	{
		// TODO: implement me
		return deck;
	}

	/// Chooses the dealer, using either the given playerId or randomly picking a player
	#chooseDealer(dealerPlayerId = null)
	{
		let playersArray = Object.values(this.#players)

		this.#currentPlayerIndex = null;
		if(!dealerPlayerId)
			this.#currentPlayerIndex = Math.floor(Math.random() * playersArray.length)
		else
		{
			this.#currentPlayerIndex = playersArray.findIndex(player => player.id == dealerPlayerId) + 1;
			if(this.#currentPlayerIndex == playersArray.length)
				this.#currentPlayerIndex = 0;
		}
	}

	/// Deals the given deck to all players
	#dealDeck(deck)
	{
		let playersArray = Object.values(this.#players)
		let p = this.#currentPlayerIndex;

		// deal all cards
		while(deck.length > 0)
		{
			let card = deck.pop();
			playersArray[p].cards.push(card);

			if(++p == playersArray.length)
				p = 0;
		}
	}

	/// Returns an array of hand-views for each player.
	///  Your own hand contains the cards, others' hands contains just the number of cards
	#getPlayersHands()
	{
		let playersArray = Object.values(this.#players)
		let playersHands = [];
		for(var p = 0; p < playersArray.length; p++)
		{
			// give each player their respective view of what everyone's hand looks like
			let handsView = playersArray.map((player, i) => {
				// your own hand and you're the game owner
				if(playersArray[p].gameOwner == true  && player.id == playersArray[p].id)
				
					return {
						playerId: player.id,
						playerName: player.name,
						cards: player.cards,
						currentPlayer: this.#currentPlayerIndex == i,
						gameOwnerButton: player.gameOwner,
						gameStarted: this.#gameStarted
					};
					// your own hand, but not the game owner
				else if (player.id == playersArray[p].id)
				return {
					playerId: player.id,
					playerName: player.name,
					cards: player.cards,
					currentPlayer: this.#currentPlayerIndex == i,
					gameOwnerButton: false
				};
				// someone elses hand
				return {
					playerName: player.name,
					playerId: player.id,
					playerName: player.name,
					cardsRemaining: player.cards.length,
					currentPlayer: this.#currentPlayerIndex == i,
					gameOwnerButton: false
				}
			})

			playersHands.push({
				playerId: playersArray[p].id,
				hands: handsView
			});
		}
		return playersHands;
	}

	/// Plays a hand into the game
	playHand(playerId, cards)
	{
		if(!this.#gameStarted)
			throw Error("Game not started");

		let player = this.#players[playerId];
		
		if(!player)
			throw Error(`Player ${playerId} does not exist`);

		if(playerId != this.#players[this.currentPlayerIndex].id)
			throw Error(`Player ${playerId} is not the current player`);

		for(var c = 0; c < cards.length; c++)
		{
			let cardIndex = player.cards.findIndex(card => card == cards[c]);
			if(cardIndex > -1)
				player.cards.splice(cardIndex, 1)
		}

		let playedHand = {
			playerId,
			cards
		};
		this.#playedHands.push(playedHand);

		this.#currentPlayerIndex++;
		if(this.#currentPlayerIndex == Object.keys(this.#players).length)
			this.#currentPlayerIndex == 0

		let playersHands = this.#getPlayersHands();

		return {
			playersHands,
			playedHand
		};
	}
}