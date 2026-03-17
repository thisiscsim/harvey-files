"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mic } from "lucide-react";
import ParticleOrb from "./particle-orb";

export type VoiceState = "idle" | "listening" | "responding";

interface VoiceTranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

export interface ScriptLine {
  role: "assistant";
  text: string;
}

interface VoiceModeProps {
  onClose: () => void;
  onTranscriptComplete?: (messages: VoiceTranscriptEntry[]) => void;
  script?: ScriptLine[];
  onScriptComplete?: () => void;
}

const DEFAULT_RESPONSES = [
  "Sure, go ahead and tell me what's on your mind.",
  "I found 3 documents that contain change of control provisions. The key terms vary significantly across the agreements — would you like me to add a comparison column?",
  "Based on my analysis, the termination clauses in these agreements follow two distinct patterns. Shall I break those down for you?",
  "I've identified the relevant sections. Let me walk you through the key differences between the two sets of documents.",
];

async function speakWithElevenLabs(
  text: string,
  onEnd?: () => void
): Promise<HTMLAudioElement | null> {
  try {
    const res = await fetch("/api/elevenlabs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) return null;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      onEnd?.();
    };
    await audio.play();
    return audio;
  } catch {
    return null;
  }
}

function speakWithBrowser(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 0.9;

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.name.includes("Daniel") ||
      v.name.includes("Google UK English Male") ||
      v.name.includes("Alex") ||
      (v.lang.startsWith("en") && v.name.toLowerCase().includes("male"))
  );
  if (preferred) utterance.voice = preferred;
  else {
    const english = voices.find((v) => v.lang.startsWith("en"));
    if (english) utterance.voice = english;
  }

  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

async function speakText(text: string, onEnd?: () => void) {
  const elevenLabsAudio = await speakWithElevenLabs(text, onEnd);
  if (!elevenLabsAudio) {
    speakWithBrowser(text, onEnd);
  }
}

export default function VoiceMode({
  onClose,
  onTranscriptComplete,
  script,
  onScriptComplete,
}: VoiceModeProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const responseIndexRef = useRef(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scriptStepRef = useRef(0);
  const isScripted = !!script && script.length > 0;
  const onScriptCompleteRef = useRef(onScriptComplete);
  const simulateResponseRef = useRef<() => void>(() => {});

  onScriptCompleteRef.current = onScriptComplete;

  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silentFrames = 0;
      const SILENCE_THRESHOLD = 0.02;
      const SILENCE_FRAMES_NEEDED = 90;

      const pollAudio = () => {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        let peak = 0;
        const len = Math.min(dataArray.length, 100);
        for (let i = 0; i < len; i++) {
          const v = dataArray[i] / 255;
          sum += v;
          if (v > peak) peak = v;
        }
        const avg = sum / len;
        const level = avg * 0.6 + peak * 0.4;
        setAudioLevel(level);

        if (level < SILENCE_THRESHOLD) {
          silentFrames++;
        } else {
          silentFrames = 0;
        }

        if (silentFrames > SILENCE_FRAMES_NEEDED && silentFrames < SILENCE_FRAMES_NEEDED + 5) {
          silenceTimerRef.current = setTimeout(() => {
            setTranscript((prev) => [
              ...prev,
              { role: "user", text: "(voice input)" },
            ]);
            simulateResponseRef.current();
          }, 200);
        }

        animFrameRef.current = requestAnimationFrame(pollAudio);
      };

      animFrameRef.current = requestAnimationFrame(pollAudio);
      setVoiceState("listening");
    } catch {
      console.error("Microphone access denied");
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const typewriterEffect = useCallback(
    (text: string, onComplete?: () => void) => {
      setIsTyping(true);
      setDisplayedText("");
      let i = 0;

      const typeNext = () => {
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i++;
          const char = text[i - 1];
          let delay = 18;
          if (char === "." || char === "?" || char === "!") delay = 60;
          else if (char === ",") delay = 40;
          else if (char === " ") delay = 12;
          typingTimeoutRef.current = setTimeout(typeNext, delay);
        } else {
          setIsTyping(false);
          onComplete?.();
        }
      };

      typeNext();
    },
    []
  );

  const deliverResponse = useCallback(
    (text: string, afterSpeech: () => void) => {
      stopMicrophone();
      setVoiceState("responding");
      setTranscript((prev) => [...prev, { role: "assistant", text }]);

      setTimeout(() => {
        typewriterEffect(text);

        speakText(text, () => {
          audioRef.current = null;
          setTimeout(() => {
            setDisplayedText("");
            afterSpeech();
          }, 800);
        });
      }, 300);
    },
    [stopMicrophone, typewriterEffect]
  );

  const advanceScript = useCallback(() => {
    if (!script) return;
    const step = scriptStepRef.current;

    if (step >= script.length) {
      setVoiceState("idle");
      onScriptCompleteRef.current?.();
      return;
    }

    const line = script[step];
    scriptStepRef.current = step + 1;
    const isLastLine = scriptStepRef.current >= script.length;

    deliverResponse(line.text, () => {
      if (isLastLine) {
        setVoiceState("idle");
        setTimeout(() => {
          onScriptCompleteRef.current?.();
        }, 500);
      } else {
        setVoiceState("idle");
        startMicrophone();
      }
    });
  }, [script, deliverResponse, startMicrophone]);

  const simulateResponse = useCallback(() => {
    if (isScripted) {
      advanceScript();
      return;
    }

    const response =
      DEFAULT_RESPONSES[responseIndexRef.current % DEFAULT_RESPONSES.length];
    responseIndexRef.current++;

    deliverResponse(response, () => {
      setVoiceState("idle");
      startMicrophone();
    });
  }, [isScripted, advanceScript, deliverResponse, startMicrophone]);

  simulateResponseRef.current = simulateResponse;

  const handleMicToggle = useCallback(() => {
    if (voiceState === "idle") {
      startMicrophone();
    } else if (voiceState === "listening") {
      setTranscript((prev) => [
        ...prev,
        { role: "user", text: "(voice input)" },
      ]);
      simulateResponse();
    }
  }, [voiceState, startMicrophone, simulateResponse]);

  const handleClose = useCallback(() => {
    stopMicrophone();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (transcript.length > 0) {
      onTranscriptComplete?.(transcript);
    }
    onClose();
  }, [stopMicrophone, onClose, onTranscriptComplete, transcript]);

  useEffect(() => {
    if (isScripted) {
      const timer = setTimeout(() => {
        advanceScript();
      }, 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        startMicrophone();
      }, 400);
      return () => clearTimeout(timer);
    }
     
  }, []);

  useEffect(() => {
    return () => {
      stopMicrophone();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopMicrophone]);

  const isResponding = voiceState === "responding";
  const isListening = voiceState === "listening";

  return (
    <motion.div
      className="flex flex-col items-center justify-center flex-1 relative overflow-hidden bg-bg-base"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Content area */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
        {/* Response text (above orb when responding) */}
        <div className="min-h-[100px] flex items-end justify-center mb-4 w-full px-10">
          <AnimatePresence mode="wait">
            {isResponding && displayedText && (
              <motion.div
                key="response-text"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-[320px] text-center"
              >
                <p className="text-[14px] leading-[22px] font-normal text-fg-base">
                  {displayedText.split(" ").map((word, i) => {
                    const totalWords = displayedText.split(" ").length;
                    const isBold = i >= totalWords - 3 && isTyping;
                    return (
                      <span
                        key={i}
                        className={isBold ? "font-medium" : "font-normal"}
                      >
                        {word}{" "}
                      </span>
                    );
                  })}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0.3] }}
                      transition={{
                        duration: 0.4,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                      className="inline-block w-[1.5px] h-[13px] ml-px align-middle bg-fg-muted"
                    />
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Particle Orb */}
        <motion.div
          layout
          animate={{
            scale: isResponding ? 0.6 : 1,
            y: isResponding ? 20 : 0,
          }}
          transition={{
            duration: 0.9,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          <ParticleOrb size={180} audioLevel={audioLevel} state={voiceState} />
        </motion.div>

        {/* Prompt text (below orb) */}
        <div className="min-h-[44px] flex items-start justify-center mt-5">
          <AnimatePresence mode="wait">
            {voiceState === "idle" && (
              <motion.p
                key="prompt-idle"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-[13px] tracking-wide text-fg-muted"
              >
                Say something...
              </motion.p>
            )}
            {isListening && (
              <motion.p
                key="prompt-listening"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-[13px] tracking-wide text-fg-muted"
              >
                Listening
                <motion.span
                  animate={{ opacity: [0.3, 1] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  ...
                </motion.span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom controls */}
      <motion.div
        className="relative z-10 flex items-center justify-center gap-3 pb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-bg-component hover:bg-bg-component-hover"
        >
          <X size={17} className="text-fg-subtle" />
        </button>
        <button
          onClick={handleMicToggle}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isListening
              ? "bg-bg-component-hover"
              : "bg-bg-component hover:bg-bg-component-hover"
          }`}
          style={
            isListening
              ? { boxShadow: "0 0 0 1px var(--border-strong)" }
              : undefined
          }
          disabled={isResponding}
        >
          <Mic
            size={17}
            className={isListening ? "text-fg-base" : "text-fg-subtle"}
          />
        </button>
      </motion.div>
    </motion.div>
  );
}
