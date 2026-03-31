import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedReaction,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import ScoreDisplay from "../components/ScoreDisplay";
import {
  COLOR_A,
  COLOR_B,
  BALL_RADIUS,
  PATH_WIDTH,
  MIN_SECTION_LENGTH,
  MAX_SECTION_LENGTH,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  SECTIONS_FOR_SPEED_INCREASE,
  BACKGROUND_COLOR,
} from "../constants/constants";

const { width, height } = Dimensions.get("window");
const BALL_Y = height * 0.7;

export default function GameScreen() {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const ballColor = useSharedValue(COLOR_A);
  const pathOffset = useSharedValue(0);
  const speed = useSharedValue(INITIAL_SPEED);

  // Minimal path sections just for prototype
  const [pathSections, setPathSections] = useState([
    { id: 0, color: COLOR_A, length: height },
    { id: 1, color: COLOR_B, length: 600 },
    { id: 2, color: COLOR_A, length: 500 },
    { id: 3, color: COLOR_B, length: 700 },
  ]);

  const animationFrameRef = useRef(null);
  const currentSectionIndex = useRef(0);
  const scoreRef = useRef(0);

  const handleDeath = useCallback(() => {
    setIsDead(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    cancelAnimationFrame(animationFrameRef.current);
    setTimeout(() => {
      router.replace({
        pathname: "/death",
        params: { score: scoreRef.current },
      });
    }, 600);
  }, [router]);

  const checkCollision = useCallback(
    (offset) => {
      let accumulatedLength = 0;
      for (let i = 0; i < pathSections.length; i++) {
        const section = pathSections[i];
        accumulatedLength += section.length;

        const sectionBottom = accumulatedLength - offset;
        const sectionTop = sectionBottom - section.length;

        // If ball is within this section's vertical bounds
        if (BALL_Y >= sectionTop && BALL_Y <= sectionBottom) {
          if (i > currentSectionIndex.current) {
            currentSectionIndex.current = i;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            if (scoreRef.current % SECTIONS_FOR_SPEED_INCREASE === 0) {
              speed.value += SPEED_INCREMENT;
            }
          }

          if (ballColor.value !== section.color) {
            handleDeath();
          }
          break;
        }
      }
    },
    [ballColor.value, handleDeath, pathSections, speed],
  );

  const gameLoop = useCallback(() => {
    if (isDead) return;
    pathOffset.value += speed.value;
    checkCollision(pathOffset.value);

    // Simple path generation (very hacky for MVP)
    if (pathOffset.value > pathSections[0].length) {
      setPathSections((prev) => {
        const last = prev[prev.length - 1];
        const newColor =
          last.color === COLOR_A
            ? COLOR_B
            : Math.random() > 0.5
              ? COLOR_A
              : COLOR_B;
        return [
          ...prev.slice(1),
          {
            id: last.id + 1,
            color: newColor,
            length:
              Math.random() * (MAX_SECTION_LENGTH - MIN_SECTION_LENGTH) +
              MIN_SECTION_LENGTH,
          },
        ];
      });
      pathOffset.value -= pathSections[0].length;
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isDead, pathOffset, speed, checkCollision, pathSections]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameLoop]);

  const handleTap = () => {
    if (isDead) return;
    ballColor.value = ballColor.value === COLOR_A ? COLOR_B : COLOR_A;
  };

  const ballStyle = useAnimatedStyle(() => ({
    backgroundColor: ballColor.value,
  }));

  const pathStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pathOffset.value }],
  }));

  return (
    <Pressable style={styles.container} onPress={handleTap}>
      <Animated.View
        style={[styles.background, { backgroundColor: ballColor }]}
      />
      <Animated.View style={[styles.pathContainer, pathStyle]}>
        {pathSections.map((section, index) => (
          <View
            key={section.id}
            style={[
              styles.pathSection,
              { backgroundColor: section.color, height: section.length },
            ]}
          />
        ))}
      </Animated.View>
      <Animated.View style={[styles.ball, ballStyle]} />
      <ScoreDisplay score={score} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    alignItems: "center",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  pathContainer: {
    position: "absolute",
    bottom: 0,
    width: PATH_WIDTH,
    alignItems: "center",
    flexDirection: "column-reverse",
  },
  pathSection: {
    width: PATH_WIDTH,
  },
  ball: {
    position: "absolute",
    width: BALL_RADIUS * 2,
    height: BALL_RADIUS * 2,
    borderRadius: BALL_RADIUS,
    top: BALL_Y - BALL_RADIUS,
    zIndex: 100,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
