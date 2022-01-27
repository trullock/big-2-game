import View from "./view.js";

export default class ClientController
{
	#ackCallbacks = {};
	#socket = null;
	#bus = null;
	#playerId = null;
	#gameId = null;

	constructor(socket, bus, playerId)
	{
		this.#socket = socket;
		this.#bus = bus;
		this.#initBus();
		this.#playerId = playerId;
	}

	#initBus()
	{
		this.#bus.subscribe('deal', (numJokers, gameStarted) => this.deal(numJokers, gameStarted));
		this.#bus.subscribe('create-game', playerName => this.createGame(playerName));
		this.#bus.subscribe('get-game-status', (id, playerName) => this.getGameStatus(id,playerName));
		this.#bus.subscribe('play-hand', cards => this.playHand(cards));

		this.#bus.subscribe('ack', result => this.#ackCallbacks[result.messageId](result));
	}

	async createGame(playerName)
	{
		let ack = await this.#send({
			command: 'create',
			playerId: this.#playerId,
			playerName: playerName,
			gameOwner: true
		});

		this.#gameId = ack.gameId;

		this.#bus.publish('game-created', {id: this.#gameId, name});
	}

	async playHand(cards)
	{
		let ack = await this.#send({
			command: 'play-hand',
			gameId: this.#gameId,
			playerId: this.#playerId,
			cards: cards
		})
	}

	deal(numJokers, gameStarted)
	{	
		return this.#send({
			command: 'deal',
			playerId: this.#playerId,
			gameId: this.#gameId,
			numJokers,
			gameStarted: gameStarted
		})
	}

	async joinGame(gameId, playerName)
	{
		let ack = await this.#send({
			command: 'join',
			playerId: this.#playerId,
			playerName: playerName,
			gameOwner: false,
			gameId
		});

		this.#gameId = gameId;

		this.#bus.publish('game-joined', {id: this.#gameId, name: ack.gameName});
	}

	// getGameStatus checks the games status with the server (started = true, not started = false). If false it runs the joinGame function to add the player. if true then alerts the player that the games started
	async getGameStatus(gameId, playerName)
	{
		let ack = await this.#send({
			command: 'server-game-status',
			gameId
		});
		
		if(!ack.gameStatus)
		this.joinGame(gameId, playerName)
		else
		this.#bus.publish('send-alert', {gameStatus: ack.gameStatus});
	}

	#send(json)
	{
		return new Promise((resolve, reject) => {
			
			let messageId = new Date().getTime();
			this.#ackCallbacks[messageId] = payload => {
				delete this.#ackCallbacks[messageId];
				if(payload.error)
					reject(payload);
				resolve(payload);
			};

			json.messageId = messageId;
			this.#socket.send(JSON.stringify(json));
		})
	}
}