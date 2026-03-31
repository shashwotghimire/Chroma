import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  SharedValue,
  runOnJS,
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
const COLLISION_GRACE = 40; // Leniency at boundaries for a visible safe-zone

interface ParticleProps {
  index: number;
  isDead: boolean;
  particleProgress: SharedValue<number>;
  ballColor: SharedValue<string>;
}

const Particle = ({ index, isDead, particleProgress, ballColor }: ParticleProps) => {
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
      style={[
        styles.particle,
        { backgroundColor: ballColor.value },
        pStyle,
      ]}
    />
  );
};

interface PathSection {
  id: number;
  color: string;
  length: number;
  absoluteBottom: number;
}

const INITIAL_SECTIONS: PathSection[] = [
  { id: 0, color: COLOR_A, length: height, absoluteBottom: 0 },
  { id: 1, color: COLOR_B, length: 600, absoluteBottom: height },
  { id: 2, color: COLOR_A, length: 500, absoluteBottom: height + 600 },
  { id: 3, color: COLOR_B, length: 700, absoluteBottom: height + 1100 },
];

export default function GameScreen() {
  const router = useRouter();
  const score = useSharedValue<number>(0);
  const [isDead, setIsDead] = useState<boolean>(false);
  const ballColor = useSharedValue<string>(COLOR_A);
  const pathOffset = useSharedValue<number>(0);
  const speed = useSharedValue<number>(INITIAL_SPEED);

  const flashOpacity = useSharedValue<number>(0);
  const particleProgress = useSharedValue<number>(0);

  const { playTap, playDeath, playScore } = useAudio();

  const [pathSections, setPathSections] = useState<PathSection[]>(INITIAL_SECTIONS);
  const pathSectionsRef = useRef<PathSection[]>([...INITIAL_SECTIONS]);

  const animationFrameRef = useRef<number | null>(null);
  const currentSectionIdRef = useRef<number>(0);
  const lastSectionColor = useRef<string | null>(null);

  const handleDeath = useCallback(
    (wrongColor: string) => {
      setIsDead(true);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

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
          params: { score: score.value.toString() },
        });
      }, 600);
    },
    [router, flashOpacity, particleProgress, playDeath, score],
  );

  const checkCollision = useCallback(
    (offset: number) => {
      const sections = pathSectionsRef.current;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        const sectionVisualBottomY = height + offset - section.absoluteBottom;
        const sectionVisualTopY = sectionVisualBottomY - section.length;

        if (
          BALL_Y >= sectionVisualTopY &&
          BALL_Y <= sectionVisualBottomY
        ) {
          if (section.id > currentSectionIdRef.current) {
            currentSectionIdRef.current = section.id;
            score.value += 1;
            runOnJS(playScore)();
            if (score.value % SECTIONS_FOR_SPEED_INCREASE === 0) {
              speed.value += SPEED_INCREMENT;
            }
          }

          const inDangerZone =
            BALL_Y >= sectionVisualTopY + COLLISION_GRACE &&
            BALL_Y <= sectionVisualBottomY - COLLISION_GRACE;

          if (inDangerZone && ballColor.value !== section.color) {
            runOnJS(handleDeath)(section.color);
          }
          break;
        }
      }
    },
    [ballColor, handleDeath, speed, playScore, score],
  );

  const gameLoop = useCallback(() => {
    if (isDead) return;
    pathOffset.value += speed.value;
    checkCollision(pathOffset.value);

    const sections = pathSectionsRef.current;
    let needsStateUpdate = false;

    // GC old sections completely below the screen
    const bottomSection = sections[0];
    const bottomSectionVisualTop = height + pathOffset.value - bottomSection.absoluteBottom - bottomSection.length;
    if (bottomSectionVisualTop > height) {
      sections.shift();
      needsStateUpdate = true;
    }

    // Generate new sections if running low
    if (sections.length < 5) {
      let lastSection = sections[sections.length - 1];
      for (let i = 0; i < 5; i++) {
        const newColor =
          lastSection.color === COLOR_A
            ? COLOR_B
            : Math.random() > 0.5
              ? COLOR_A
              : COLOR_B;
        const newLength =
          Math.random() * (MAX_SECTION_LENGTH - MIN_SECTION_LENGTH) +
          MIN_SECTION_LENGTH;
        
        const newSection = {
          id: lastSection.id + 1,
          color: newColor,
          length: newLength,
          absoluteBottom: lastSection.absoluteBottom + lastSection.length,
        };
        sections.push(newSection);
        lastSection = newSection;
      }
      needsStateUpdate = true;
    }

    if (needsStateUpdate) {
      setPathSections([...sections]);
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isDead, pathOffset, speed, checkCollision]);

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
              { 
                backgroundColor: section.color, 
                height: section.length,
                bottom: section.absoluteBottom 
              },
            ]}
          >
            <View style={styles.sectionBorderTop} />
            <View style={styles.sectionBorderBottom} />
            <View style={styles.safeZone} />
          </View>
        ))}
      </Animated.View>
      <Animated.View style={[styles.ball, ballStyle]} />

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
  },
  pathSection: {
    position: "absolute",
    width: PATH_WIDTH,
  },
  sectionBorderTop: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 4,
    backgroundColor: "#000000",
    zIndex: 2,
  },
  sectionBorderBottom: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 4,
    backgroundColor: "#000000",
    zIndex: 2,
  },
  safeZone: {
    position: "absolute",
    top: -COLLISION_GRACE,
    height: COLLISION_GRACE * 2,
    width: "100%",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderStyle: "dashed",
    zIndex: 10,
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
