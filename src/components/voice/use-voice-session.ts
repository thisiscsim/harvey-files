"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type ConversationState = "disconnected" | "connected" | "error";
export type VoiceSessionState = "idle" | "listening" | "responding";

interface VoiceTranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

interface UseVoiceSessionOptions {
  agentId?: string;
  onMessage?: (entry: VoiceTranscriptEntry) => void;
  onStateChange?: (state: VoiceSessionState) => void;
}

const DEMO_RESPONSES = [
  "Sure, go ahead and tell me what's on your mind.",
  "I found 3 documents that contain change of control provisions. The key terms vary significantly across the agreements — would you like me to add a comparison column?",
  "Based on my analysis, the termination clauses in these agreements follow two distinct patterns. Shall I break those down for you?",
  "I've identified the relevant sections. Let me walk you through the key differences between the two sets of documents.",
  "The indemnification caps range from 50% to 100% of the total deal value across these agreements. I can create a summary table if that would help.",
];

export function useVoiceSession(options: UseVoiceSessionOptions = {}) {
  const { agentId, onMessage, onStateChange } = options;
  const [connectionState, setConnectionState] = useState<ConversationState>("disconnected");
  const [sessionState, setSessionState] = useState<VoiceSessionState>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);

  const responseIndexRef = useRef(0);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onStateChangeRef.current = onStateChange;
  }, [onMessage, onStateChange]);

  const updateSessionState = useCallback((s: VoiceSessionState) => {
    setSessionState(s);
    onStateChangeRef.current?.(s);
  }, []);

  const startSession = useCallback(async () => {
    setConnectionState("connected");
    updateSessionState("idle");
    setTranscript([]);
  }, [updateSessionState]);

  const endSession = useCallback(() => {
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    setConnectionState("disconnected");
    updateSessionState("idle");
    setIsSpeaking(false);
  }, [updateSessionState]);

  const simulateUserInput = useCallback((text?: string) => {
    const entry: VoiceTranscriptEntry = {
      role: "user",
      text: text || "(voice input)",
    };
    setTranscript((prev) => [...prev, entry]);
    onMessageRef.current?.(entry);
    return entry;
  }, []);

  const simulateResponse = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      updateSessionState("responding");
      setIsSpeaking(true);

      const response = DEMO_RESPONSES[responseIndexRef.current % DEMO_RESPONSES.length];
      responseIndexRef.current++;

      const entry: VoiceTranscriptEntry = { role: "assistant", text: response };
      setTranscript((prev) => [...prev, entry]);
      onMessageRef.current?.(entry);

      const estimatedDuration = response.length * 50;
      demoTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
        updateSessionState("idle");
        resolve(response);
      }, estimatedDuration);
    });
  }, [updateSessionState]);

  useEffect(() => {
    return () => {
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    };
  }, []);

  return {
    connectionState,
    sessionState,
    isSpeaking,
    transcript,
    startSession,
    endSession,
    simulateUserInput,
    simulateResponse,
    isDemo: !agentId,
  };
}
