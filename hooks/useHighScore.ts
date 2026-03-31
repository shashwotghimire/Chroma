import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useHighScore() {
  const [highScore, setHighScore] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const loadHighScore = useCallback(async () => {
    try {
      const score = await AsyncStorage.getItem("@high_score");
      if (score !== null) {
        setHighScore(parseInt(score, 10));
      }
    } catch (e) {
      console.error("Failed to load high score:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveScoreIfBest = useCallback(async (newScore: number) => {
    try {
      const scoreStr = await AsyncStorage.getItem("@high_score");
      const currentBest = scoreStr ? parseInt(scoreStr, 10) : 0;

      if (newScore > currentBest) {
        await AsyncStorage.setItem("@high_score", newScore.toString());
        setHighScore(newScore);
        return newScore;
      }
      setHighScore(currentBest);
      return currentBest;
    } catch (e) {
      console.error("Failed to save high score:", e);
      return newScore;
    }
  }, []);

  useEffect(() => {
    loadHighScore();
  }, [loadHighScore]);

  return { highScore, saveScoreIfBest, isLoaded };
}
