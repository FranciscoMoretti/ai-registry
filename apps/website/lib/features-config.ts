import type { LucideIcon } from "lucide-react";
import { Brain, Eye, FileText, Image, Mic, Zap } from "lucide-react";

export type FeatureConfig = {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
  category: "capability" | "input" | "output";
};

export const AVAILABLE_FEATURES: Record<string, FeatureConfig> = {
  reasoning: {
    key: "reasoning",
    name: "Reasoning",
    description: "Advanced reasoning capabilities",
    icon: Brain,
    enabled: true,
    category: "capability",
  },
  functionCalling: {
    key: "functionCalling",
    name: "Tools",
    description: "Tool calling support",
    icon: Zap,
    enabled: true,
    category: "capability",
  },
  imageInput: {
    key: "imageInput",
    name: "Vision",
    description: "Supports image input",
    icon: Eye,
    enabled: true,
    category: "input",
  },
  pdfInput: {
    key: "pdfInput",
    name: "PDF",
    description: "Supports PDF input",
    icon: FileText,
    enabled: true,
    category: "input",
  },
  audioInput: {
    key: "audioInput",
    name: "Audio Input",
    description: "Supports audio input",
    icon: Mic,
    enabled: false, // Not available yet
    category: "input",
  },
  imageOutput: {
    key: "imageOutput",
    name: "Image Output",
    description: "Supports image generation",
    icon: Image,
    enabled: false, // Not available yet
    category: "output",
  },
  audioOutput: {
    key: "audioOutput",
    name: "Audio Output",
    description: "Supports audio generation",
    icon: Mic,
    enabled: false, // Not available yet
    category: "output",
  },
} as const;

// Get only enabled features
export const getEnabledFeatures = () =>
  Object.values(AVAILABLE_FEATURES).filter((feature) => feature.enabled);

// Get enabled features by category
export const getEnabledFeaturesByCategory = (
  category: FeatureConfig["category"]
) => getEnabledFeatures().filter((feature) => feature.category === category);

// Helper to get feature config by key
export const getFeatureConfig = (key: string): FeatureConfig | undefined =>
  AVAILABLE_FEATURES[key];

// Helper to check if a feature is enabled
export const isFeatureEnabled = (key: string): boolean =>
  AVAILABLE_FEATURES[key]?.enabled ?? false;
