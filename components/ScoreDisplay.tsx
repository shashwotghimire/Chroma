import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import Animated, { useAnimatedProps, SharedValue } from "react-native-reanimated";

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface ScoreDisplayProps {
  score: SharedValue<number>;
}

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  const animatedProps = useAnimatedProps(() => {
    return {
      text: score.value.toString(),
    } as any;
  });

  return (
    <View style={styles.container}>
      <AnimatedTextInput
        underlineColorAndroid="transparent"
        editable={false}
        value={score.value.toString()}
        animatedProps={animatedProps}
        style={styles.scoreText}
      />
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
    textAlign: "center",
  },
});
