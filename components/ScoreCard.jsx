import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLOR_A, COLOR_B } from "../constants/constants";

export default function ScoreCard({ score, bestScore }) {
  return (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: COLOR_A }]} />
      <View style={styles.content}>
        <Text style={styles.title}>CHROMA</Text>
        <Text style={styles.scoreText}>SCORE: {score}</Text>
        <Text style={styles.bestText}>BEST: {bestScore}</Text>
      </View>
      <View style={[styles.stripe, { backgroundColor: COLOR_B }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    alignItems: "center",
    marginBottom: 40,
  },
  stripe: {
    width: "100%",
    height: 12,
  },
  content: {
    paddingVertical: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 24,
    color: "#000",
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  bestText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#888",
  },
});
