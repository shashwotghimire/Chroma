import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import ScoreDisplay from "../components/ScoreDisplay";
import { useAudio } from "../hooks/useAudio";
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
const NUM_PARTICLES = 12;

interface ParticleProps {
  index: number;
  isDead: boolean;
  particleProgress: SharedValue<number>;
  ballColor: SharedValue<string>;
}

const Particle = ({
  index,
  isDead,
  particleProgress,
  ballColor,
}: ParticleProps) => {
  const angle = (index / NUM_PARTICLES) * Math.PI * 2;
  const distance = 80;

  const pStyle = useAnimatedStyle(() => ({
    opacity: isDead ? 1 - particleProgress.value : 0,
    transform: [
      { translateX: Math.cos(angle) * (distance * particleProgress.value) },
      { translateY: Math.sin(angle) * (distance * particleProgress.value) },
      { scale: 1 - particleProgress.value },
    ],
  }));

  return (
    <Animated.View
      style={[styles.particle, { backgroundColor: ballColor.value }, pStyle]}
    />
  );
};

interface PathSection {
  id: number;
  color: string;
  length: number;
}

export default function GameScreen() {
  const router = useRouter();
  const [score, setScore] = useState<number>(0);
  const [isDead, setIsDead] = useState<boolean>(false);
  const ballColor = useSharedValue<string>(COLOR_A);
  const pathOffset = useSharedValue<number>(0);
  const speed = useSharedValue<number>(INITIAL_SPEED);

  const flashOpacity = useSharedValue<number>(0);
  const particleProgress = useSharedValue<number>(0);

  const { playTap, playDeath, playScore } = useAudio();

  const [pathSections, setPathSections] = useState<PathSection[]>([
    { id: 0, color: COLOR_A, length: height },
    { id: 1, color: COLOR_B, length: 600 },
    { id: 2, color: COLOR_A, length: 500 },
    { id: 3, color: COLOR_B, length: 700 },
  ]);

  const animationFrameRef = useRef<number | null>(null);
  const currentSectionIndex = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const lastSectionColor = useRef<string | null>(null);

  const handleDeath = useCallback(
    (wrongColor: string) => {
      setIsDead(true);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Death sequence
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      playDeath();

      flashOpacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0, { duration: 500 }),
      );

      particleProgress.value = withTiming(1, { duration: 500 });

      lastSectionColor.current = wrongColor;

      setTimeout(() => {
        router.replace({
          pathname: "/death",
          params: { score: scoreRef.current },
        });
      }, 600);
    },
    [router, flashOpacity, particleProgress, playDeath],
  );

  const checkCollision = useCallback(
    (offset: number) => {
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
            playScore();
            if (scoreRef.current % SECTIONS_FOR_SPEED_INCREASE === 0) {
              speed.value += SPEED_INCREMENT;
            }
          }

          if (ballColor.value !== section.color) {
            runOnJS(handleDeath)(section.color);
          }
          break;
        }
      }
    },
    [ballColor.value, handleDeath, pathSections, speed, playScore],
  );

  const gameLoop = useCallback(() => {
    if (isDead) return;
    pathOffset.value += speed.value;
    checkCollision(pathOffset.value);

    // Dynamic path generation
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
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  const handleTap = () => {
    if (isDead) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playTap();
    ballColor.value = ballColor.value === COLOR_A ? COLOR_B : COLOR_A;
  };

  const ballStyle = useAnimatedStyle(() => ({
    backgroundColor: ballColor.value,
    opacity: isDead ? 0 : 1,
  }));

  const pathStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pathOffset.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: lastSectionColor.current || "#000",
  }));

  return (
    <Pressable style={styles.container} onPress={handleTap}>
      <Animated.View
        style={[styles.background, { backgroundColor: ballColor }]}
      />
      <Animated.View style={[styles.pathContainer, pathStyle]}>
        {pathSections.map((section) => (
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

      {/* Particle Explosion */}
      <View style={styles.particleContainer} pointerEvents="none">
        {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
          <Particle
            key={i}
            index={i}
            isDead={isDead}
            particleProgress={particleProgress}
            ballColor={ballColor}
          />
        ))}
      </View>

      <ScoreDisplay score={score} />

      {/* Death Flash */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, flashStyle]}
        pointerEvents="none"
      />
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
  particleContainer: {
    position: "absolute",
    top: BALL_Y,
    left: width / 2,
    zIndex: 101,
  },
  particle: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    top: -6,
    left: -6,
  },
});
