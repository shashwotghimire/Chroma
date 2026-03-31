import { View, Text, StyleSheet } from "react-native";

export default function ScoreDisplay({ score }) {
  return (
    <View style={styles.container}>
      <Text style={styles.scoreText}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    width: "100%",
    alignItems: "center",
    zIndex: 10,
  },
  scoreText: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#000",
    opacity: 0.8,
  },
});
