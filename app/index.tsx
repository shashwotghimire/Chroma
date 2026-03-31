import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useHighScore } from "../hooks/useHighScore";

export default function StartScreen() {
  const router = useRouter();
  const { highScore } = useHighScore();

  return (
    <Pressable style={styles.container} onPress={() => router.replace("/game")}>
      <View style={styles.content}>
        <Text style={styles.title}>CHROMA</Text>
        <Text style={styles.bestScore}>BEST: {highScore}</Text>
        <Text style={styles.prompt}>TAP TO PLAY</Text>
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
    fontSize: 64,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 4,
    marginBottom: 20,
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
