import "./styles/global.css";
import { createGame } from "./game";
import { gameState } from "./state/GameState";

gameState.load();
createGame();
