import { useEffect, useRef } from "react";
import { Audio } from "expo-av";

export function useAudio() {
  const tapSound = useRef(null);
  const deathSound = useRef(null);
  const scoreSound = useRef(null);

  useEffect(() => {
    async function loadSounds() {
      try {
        const { sound: tap } = await Audio.Sound.createAsync(
          require("../assets/sounds/tap.mp3"),
        );
        tapSound.current = tap;

        const { sound: death } = await Audio.Sound.createAsync(
          require("../assets/sounds/death.mp3"),
        );
        deathSound.current = death;

        const { sound: score } = await Audio.Sound.createAsync(
          require("../assets/sounds/score.mp3"),
        );
        scoreSound.current = score;
      } catch (error) {
        console.warn("Could not load placeholder sounds", error);
      }
    }

    loadSounds();

    return () => {
      if (tapSound.current) tapSound.current.unloadAsync();
      if (deathSound.current) deathSound.current.unloadAsync();
      if (scoreSound.current) scoreSound.current.unloadAsync();
    };
  }, []);

  const playTap = async () => {
    try {
      if (tapSound.current) await tapSound.current.replayAsync();
    } catch (e) {
      console.warn("Tap sound failed");
    }
  };

  const playDeath = async () => {
    try {
      if (deathSound.current) await deathSound.current.replayAsync();
    } catch (e) {
      console.warn("Death sound failed");
    }
  };

  const playScore = async () => {
    try {
      if (scoreSound.current) await scoreSound.current.replayAsync();
    } catch (e) {
      console.warn("Score sound failed");
    }
  };

  return { playTap, playDeath, playScore };
}
