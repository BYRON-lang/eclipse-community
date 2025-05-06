
import React from "react";
import { ComingSoonPlaceholder } from "@/components/placeholder/ComingSoonPlaceholder";
import { Headphones } from "lucide-react";

export default function VoicePage() {
  return (
    <ComingSoonPlaceholder
      title="Voice Lounge Coming Soon"
      description="Join audio rooms, host conversations, and connect with others through voice in real-time."
      icon={<Headphones size={60} />}
    />
  );
}
