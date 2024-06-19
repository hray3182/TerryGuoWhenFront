
export interface Game {
    game_id: string;
    game_state: string;
}

export interface GameResult {
    game_id: string;
    game_state: string;
    result: number[];
}