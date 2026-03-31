import { View, Text, StyleSheet, Pressable, Share } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useHighScore } from "../hooks/useHighScore";
import { useEffect } from "react";
import ScoreCard from "../components/ScoreCard";

export default function DeathScreen() {
  const router = useRouter();
  const { score } = useLocalSearchParams();
  const currentScore = parseInt(score, 10) || 0;
  const { highScore, saveHighScore } = useHighScore();

  const finalBest = Math.max(currentScore, highScore);

  useEffect(() => {
    if (currentScore > highScore) {
      saveHighScore(currentScore);
    }
  }, [currentScore, highScore, saveHighScore]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I scored ${currentScore} in Chroma! Can you beat my best of ${finalBest}?`,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GAME OVER</Text>

      <ScoreCard score={currentScore} bestScore={finalBest} />

      <View style={styles.buttons}>
        <Pressable
          style={styles.button}
          onPress={() => router.replace("/game")}
        >
          <Text style={styles.buttonText}>PLAY AGAIN</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.shareButton]}
          onPress={handleShare}
        >
          <Text style={[styles.buttonText, styles.shareButtonText]}>
            SHARE SCORE
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: "#000000",
    marginBottom: 40,
  },
  buttons: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: 250,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  shareButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#000",
  },
  shareButtonText: {
    color: "#000",
  },
});
