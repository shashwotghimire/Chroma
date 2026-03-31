import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useHighScore } from "../hooks/useHighScore";

export default function StartScreen() {
  const router = useRouter();
  const { highScore } = useHighScore();

  const startGame = (mode: string) => {
    router.replace({ pathname: "/game", params: { mode } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>CHROMA</Text>
        <Text style={styles.bestScore}>BEST: {highScore}</Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.easyButton]}
            onPress={() => startGame("easy")}
          >
            <Text style={styles.buttonText}>EASY</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.mediumButton]}
            onPress={() => startGame("medium")}
          >
            <Text style={styles.buttonText}>MEDIUM</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.hardButton]}
            onPress={() => startGame("hard")}
          >
            <Text style={styles.buttonText}>HARD</Text>
          </Pressable>
        </View>
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
  },
  content: {
    alignItems: "center",
    width: "100%",
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
  buttonContainer: {
    width: "80%",
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000000",
  },
  easyButton: {
    backgroundColor: "#E8F5E9",
  },
  mediumButton: {
    backgroundColor: "#FFF3E0",
  },
  hardButton: {
    backgroundColor: "#FFEBEE",
  },
  buttonText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: 2,
  },
});
