import React, { useRef, useState, useCallback } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  SharedValue,
  useFrameCallback,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
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
  MAX_SPEED,
  MEDIUM_INITIAL_SPEED,
  MEDIUM_SPEED_INCREMENT,
  MEDIUM_MAX_SPEED,
  SECTIONS_FOR_SPEED_INCREASE,
  BACKGROUND_COLOR,
} from "../constants/constants";

const { width, height } = Dimensions.get("window");
const BALL_Y = height * 0.7;
const NUM_PARTICLES = 12;
const PARTICLE_INDICES = Array.from({ length: NUM_PARTICLES }).map((_, i) => i);
const COLLISION_GRACE = 35; // Leniency at boundaries

interface ParticleProps {
  index: number;
  isDead: SharedValue<boolean>;
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
    opacity: isDead.value ? 1 - particleProgress.value : 0,
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
  visualColor: string;
  hideBorder: boolean;
  length: number;
  absoluteBottom: number;
}

const INITIAL_SECTIONS: PathSection[] = [
  {
    id: 0,
    color: COLOR_A,
    visualColor: COLOR_A,
    hideBorder: false,
    length: height,
    absoluteBottom: 0,
  },
  {
    id: 1,
    color: COLOR_B,
    visualColor: COLOR_B,
    hideBorder: false,
    length: 400,
    absoluteBottom: height,
  },
  {
    id: 2,
    color: COLOR_A,
    visualColor: COLOR_A,
    hideBorder: false,
    length: 400,
    absoluteBottom: height + 400,
  },
  {
    id: 3,
    color: COLOR_B,
    visualColor: COLOR_B,
    hideBorder: false,
    length: 400,
    absoluteBottom: height + 800,
  },
];

export default function GameScreen() {
  const router = useRouter();
  const { mode = "easy" } = useLocalSearchParams<{ mode: string }>();

  // Determine difficulty settings
  const isMediumOrHard = mode === "medium" || mode === "hard";
  const startSpeed = isMediumOrHard ? MEDIUM_INITIAL_SPEED : INITIAL_SPEED;
  const speedIncrement = isMediumOrHard
    ? MEDIUM_SPEED_INCREMENT
    : SPEED_INCREMENT;
  const maxPlayableSpeed = isMediumOrHard ? MEDIUM_MAX_SPEED : MAX_SPEED;

  const score = useSharedValue<number>(0);
  const isDead = useSharedValue<boolean>(false);
  const ballColor = useSharedValue<string>(COLOR_A);
  const pathOffset = useSharedValue<number>(0);
  const speed = useSharedValue<number>(startSpeed);
  const nextBoundaryAbsoluteY = useSharedValue<number>(
    INITIAL_SECTIONS[1].absoluteBottom,
  );

  const flashOpacity = useSharedValue<number>(0);
  const particleProgress = useSharedValue<number>(0);

  const { playTap, playDeath, playScore } = useAudio();

  const [pathSections, setPathSections] =
    useState<PathSection[]>(INITIAL_SECTIONS);
  const pathSectionsRef = useRef<PathSection[]>([...INITIAL_SECTIONS]);

  const currentSectionIdRef = useRef<number>(0);
  const lastSectionColor = useRef<string | null>(null);

  const handleDeath = useCallback(
    (wrongColor: string) => {
      isDead.value = true;

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
          params: { score: score.value.toString(), mode },
        });
      }, 600);
    },
    [router, flashOpacity, particleProgress, playDeath, score, isDead, mode],
  );

  useFrameCallback((frameInfo) => {
    if (isDead.value) return;
    const dt = frameInfo.timeSincePreviousFrame || 16.666;
    const timeScale = dt / 16.666;
    pathOffset.value += speed.value * timeScale;
  });

  const checkCollisionAndGenerate = useCallback(
    (offset: number) => {
      const sections = pathSectionsRef.current;

      // 1. Check Collision
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        const sectionVisualBottomY = height + offset - section.absoluteBottom;
        const sectionVisualTopY = sectionVisualBottomY - section.length;

        if (BALL_Y >= sectionVisualTopY && BALL_Y <= sectionVisualBottomY) {
          if (section.id > currentSectionIdRef.current) {
            currentSectionIdRef.current = section.id;
            score.value += 1;
            playScore();
            if (score.value % SECTIONS_FOR_SPEED_INCREASE === 0) {
              speed.value = Math.min(
                speed.value + speedIncrement,
                maxPlayableSpeed,
              );
            }

            // Track the absolute boundary we are approaching next
            const nextSec = sections.find((s) => s.id === section.id + 1);
            if (nextSec) {
              nextBoundaryAbsoluteY.value = nextSec.absoluteBottom;
            }
          }

          const inDangerZone =
            BALL_Y >= sectionVisualTopY + COLLISION_GRACE &&
            BALL_Y <= sectionVisualBottomY - COLLISION_GRACE;

          if (inDangerZone && ballColor.value !== section.color) {
            handleDeath(section.color);
          }
          break;
        }
      }

      // 2. Garbage Collection & Generation
      let needsStateUpdate = false;

      let offscreenCount = 0;
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const secVisualTop = height + offset - sec.absoluteBottom - sec.length;
        if (secVisualTop > height + 200) {
          offscreenCount++;
        } else {
          break;
        }
      }

      if (offscreenCount >= 5) {
        sections.splice(0, 5);
        needsStateUpdate = true;
      }

      if (sections.length < 10) {
        let lastSection = sections[sections.length - 1];
        for (let i = 0; i < 10; i++) {
          const newColor = lastSection.color === COLOR_A ? COLOR_B : COLOR_A;
          const newLength =
            Math.random() * (MAX_SECTION_LENGTH - MIN_SECTION_LENGTH) +
            MIN_SECTION_LENGTH;

          let newVisualColor = newColor;
          let newHideBorder = false;

          if (mode === "hard" && Math.random() < 0.3) {
            newVisualColor = lastSection.visualColor;
            newHideBorder = true;
          } else {
            newVisualColor =
              lastSection.visualColor === COLOR_A ? COLOR_B : COLOR_A;
          }

          const newSection: PathSection = {
            id: lastSection.id + 1,
            color: newColor,
            visualColor: newVisualColor,
            hideBorder: newHideBorder,
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
    },
    [
      ballColor,
      handleDeath,
      speed,
      playScore,
      score,
      nextBoundaryAbsoluteY,
      mode,
      speedIncrement,
      maxPlayableSpeed,
    ],
  );

  useAnimatedReaction(
    () => pathOffset.value,
    (offset, prevOffset) => {
      // Only call JS if it actually changed and game is active
      if (offset !== prevOffset && !isDead.value) {
        runOnJS(checkCollisionAndGenerate)(offset);
      }
    },
  );

  const handleTap = () => {
    if (isDead.value) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playTap();
    ballColor.value = ballColor.value === COLOR_A ? COLOR_B : COLOR_A;
  };

  const ballStyle = useAnimatedStyle(() => {
    let translateX = 0;
    let translateY = 0;

    if (!isDead.value) {
      const boundaryVisualY =
        height + pathOffset.value - nextBoundaryAbsoluteY.value;
      const distance = Math.abs(BALL_Y - boundaryVisualY);

      if (distance < COLLISION_GRACE + 40) {
        const shakeIntensity = 1 - distance / (COLLISION_GRACE + 40);
        translateX = Math.sin(pathOffset.value * 1.5) * (shakeIntensity * 6);
        translateY = Math.cos(pathOffset.value * 1.3) * (shakeIntensity * 6);
      }
    }

    return {
      backgroundColor: ballColor.value,
      opacity: isDead.value ? 0 : 1,
      transform: [{ translateX }, { translateY }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    if (isDead.value) return { opacity: 0, transform: [{ scale: 1 }] };

    // Calculate distance to the next boundary line visually
    const boundaryVisualY =
      height + pathOffset.value - nextBoundaryAbsoluteY.value;
    const distance = Math.abs(BALL_Y - boundaryVisualY);

    // Glow intensifies within 150px of the boundary
    const VISUAL_GRACE_DIST = 150;

    let intensity = 0;
    let translateX = 0;
    let translateY = 0;
    // Determine the glow color by asking what the NEXT color needs to be.
    // If the ball is currently COLOR_A, it needs to be COLOR_B to survive.
    let glowColor = ballColor.value === COLOR_A ? COLOR_B : COLOR_A;

    if (distance < VISUAL_GRACE_DIST) {
      intensity = 1 - distance / VISUAL_GRACE_DIST;

      // When getting dangerously close (e.g. inside or right next to collision grace)
      if (distance < COLLISION_GRACE + 40) {
        // Violent shaking based on the continuously updating pathOffset
        const shakeIntensity = 1 - distance / (COLLISION_GRACE + 40);
        translateX = Math.sin(pathOffset.value * 0.8) * (shakeIntensity * 12);
        translateY = Math.cos(pathOffset.value * 0.9) * (shakeIntensity * 12);
      }
    }

    return {
      opacity: intensity, // Max opacity 100%
      backgroundColor: glowColor,
      shadowColor: glowColor,
      transform: [
        { translateX },
        { translateY },
        { scale: 1 + intensity * 1.5 },
      ], // Max scale 2.5x
    };
  });

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
                backgroundColor: section.visualColor,
                height: section.length,
                bottom: section.absoluteBottom,
              },
            ]}
          >
            {!section.hideBorder && <View style={styles.sectionBorderTop} />}
          </View>
        ))}
      </Animated.View>

      <Animated.View style={[styles.ballGlow, glowStyle]} />
      <Animated.View style={[styles.ball, ballStyle]} />

      <View style={styles.particleContainer} pointerEvents="none">
        {PARTICLE_INDICES.map((i) => (
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
    height: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 2,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0,0,0,0.3)",
  },
  ballGlow: {
    position: "absolute",
    width: BALL_RADIUS * 2,
    height: BALL_RADIUS * 2,
    borderRadius: BALL_RADIUS,
    top: BALL_Y - BALL_RADIUS,
    zIndex: 99,
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
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
