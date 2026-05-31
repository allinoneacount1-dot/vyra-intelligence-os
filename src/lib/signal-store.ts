// VYRA Signal Store — Reactive state management for the Intelligence OS
import { useState, useEffect, useCallback, useRef } from "react";
import type { ChainEvent, LiquidityFeatures, LiquidityPrediction, ConsensusResult, Chain } from "./chain-adapters/types";
import type { PredictionState } from "./prediction-engine";
import type { SocietyResult } from "./agent-society/index";
import { simulator } from "./chain-adapters/simulator";
import { extractFeatures } from "./feature-engine";
import { generatePrediction, detectTemporalPatterns } from "./prediction-engine";
import { runAgentSociety, ALL_AGENTS } from "./agent-society/index";
import { vectorMemory } from "./vector-memory";

export interface SignalState {
  events: ChainEvent[];
  features: LiquidityFeatures;
  predictions: LiquidityPrediction[];
  predictionState: PredictionState | null;
  societyResult: SocietyResult | null;
  temporalPatterns: { pattern: string; strength: number; description: string }[];
  chainHealth: Record<Chain, number>;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  totalVolume: number;
  chainVolumes: Record<Chain, number>;
  eventCount: number;
  isRunning: boolean;
  featureHistory: LiquidityFeatures[];
}

const DEFAULT_FEATURES: LiquidityFeatures = {
  walletActivity: 0,
  chainRotationSpeed: 0,
  volumeAcceleration: 0,
  smartMoneyRatio: 0,
  whaleDensity: 0,
  narrativeHeat: 0,
  liquidityDepth: 0,
  tokenAgeDistribution: 0,
};

export function useSignalStore() {
  const [state, setState] = useState<SignalState>({
    events: [],
    features: DEFAULT_FEATURES,
    predictions: [],
    predictionState: null,
    societyResult: null,
    temporalPatterns: [],
    chainHealth: { SOL: 0.5, ETH: 0.5, BASE: 0.5, BNB: 0.5 },
    riskLevel: "LOW",
    totalVolume: 0,
    chainVolumes: { SOL: 0, ETH: 0, BASE: 0, BNB: 0 },
    eventCount: 0,
    isRunning: false,
    featureHistory: [],
  });

  const featureHistoryRef = useRef<LiquidityFeatures[]>([]);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const updateState = useCallback(() => {
    const events = simulator.getRecent(500);
    const features = extractFeatures(events.slice(-100));
    const predictionState = generatePrediction(events);
    const societyResult = runAgentSociety(events.slice(-100), features);

    // Store in feature history
    featureHistoryRef.current.push(features);
    if (featureHistoryRef.current.length > 50) featureHistoryRef.current.shift();

    const temporalPatterns = detectTemporalPatterns(featureHistoryRef.current);

    // Store some events in vector memory
    const recentEvents = events.slice(-5);
    recentEvents.forEach(e => vectorMemory.store(e));

    setState({
      events: events.slice(-50), // Keep last 50 for UI
      features,
      predictions: predictionState.predictions,
      predictionState,
      societyResult,
      temporalPatterns,
      chainHealth: predictionState.chainHealth,
      riskLevel: predictionState.riskLevel,
      totalVolume: simulator.getTotalVolume(),
      chainVolumes: simulator.getChainVolumes(),
      eventCount: events.length,
      isRunning: true,
      featureHistory: [...featureHistoryRef.current],
    });
  }, []);

  const start = useCallback(() => {
    simulator.start(2); // 2 events per second
    updateState(); // Initial state
    updateIntervalRef.current = setInterval(updateState, 2000); // Update UI every 2s
    setState(prev => ({ ...prev, isRunning: true }));
  }, [updateState]);

  const stop = useCallback(() => {
    simulator.stop();
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  useEffect(() => {
    start();
    return () => {
      simulator.stop();
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, [start]);

  return { ...state, start, stop };
}
