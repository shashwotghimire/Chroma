import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

export function useHighScore() {
  const [highScore, setHighScore] = useState(0);

  const loadHighScore = useCallback(async () => {
    try {
      const score = await AsyncStorage.getItem("@high_score");
      if (score !== null) {
        setHighScore(parseInt(score, 10));
      }
    } catch (e) {
      console.error("Failed to load high score:", e);
    }
  }, []);

  const saveHighScore = useCallback(async (newScore) => {
    try {
      await AsyncStorage.setItem("@high_score", newScore.toString());
      setHighScore(newScore);
    } catch (e) {
      console.error("Failed to save high score:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHighScore();
    }, [loadHighScore]),
  );

  return { highScore, saveHighScore, loadHighScore };
}
