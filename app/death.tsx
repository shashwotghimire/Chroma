import { View, Text, StyleSheet, Pressable, Share } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useHighScore } from "../hooks/useHighScore";
import { useEffect } from "react";
import ScoreCard from "../components/ScoreCard";

export default function DeathScreen() {
  const router = useRouter();
  const { score, mode = "easy" } = useLocalSearchParams<{
    score: string;
    mode: string;
  }>();
  const currentScore = parseInt(score, 10) || 0;
  const { highScore, saveScoreIfBest, isLoaded } = useHighScore();

  const finalBest = Math.max(currentScore, highScore);

  useEffect(() => {
    if (isLoaded) {
      saveScoreIfBest(currentScore);
    }
  }, [currentScore, isLoaded, saveScoreIfBest]);

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `I scored ${currentScore} in Chroma (${mode} mode)! Can you beat my best of ${finalBest}?`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const handlePlayAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({ pathname: "/game", params: { mode } });
  };

  const handleHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GAME OVER</Text>

      <ScoreCard score={currentScore} bestScore={finalBest} />

      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={handlePlayAgain}>
          <Text style={styles.buttonText}>PLAY AGAIN</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.homeButton]}
          onPress={handleHome}
        >
          <Text style={[styles.buttonText, styles.homeButtonText]}>
            HOME (CHANGE DIFFICULTY)
          </Text>
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
    width: 280,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  homeButton: {
    backgroundColor: "#F0F0F0",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  homeButtonText: {
    color: "#333",
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
