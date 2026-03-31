import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useHighScore } from "../hooks/useHighScore";
import { useEffect } from "react";

export default function DeathScreen() {
  const router = useRouter();
  const { score } = useLocalSearchParams();
  const currentScore = parseInt(score, 10) || 0;
  const { highScore, saveHighScore } = useHighScore();

  useEffect(() => {
    if (currentScore > highScore) {
      saveHighScore(currentScore);
    }
  }, [currentScore, highScore, saveHighScore]);

  return (
    <Pressable style={styles.container} onPress={() => router.replace("/game")}>
      <View style={styles.content}>
        <Text style={styles.title}>GAME OVER</Text>
        <Text style={styles.score}>SCORE: {currentScore}</Text>
        <Text style={styles.bestScore}>
          BEST: {Math.max(currentScore, highScore)}
        </Text>
        <Text style={styles.prompt}>TAP TO RESTART</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: "#000000",
    marginBottom: 40,
  },
  score: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 10,
  },
  bestScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#888888",
    marginBottom: 60,
  },
  prompt: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    opacity: 0.5,
  },
});
