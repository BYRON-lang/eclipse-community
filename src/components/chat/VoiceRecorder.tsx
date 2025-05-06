
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSendVoice, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Auto stop at 60 seconds
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record voice messages.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSendVoice(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="p-2 bg-eclipse-background/50 rounded-lg border border-eclipse-border">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {isRecording ? "Recording voice message..." : "Voice message"}
          </span>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={onCancel}>
            <Trash size={16} />
          </Button>
        </div>
        
        {isRecording && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-red-500 animate-pulse">● REC</span>
              <span>{formatTime(recordingTime)}</span>
            </div>
            <Progress value={(recordingTime / 60) * 100} className="h-1" />
          </div>
        )}
        
        {audioURL && !isRecording && (
          <audio ref={audioRef} src={audioURL} controls className="w-full h-10 mb-2" />
        )}
        
        <div className="flex justify-center space-x-3">
          {isRecording ? (
            <Button 
              onClick={stopRecording} 
              variant="outline" 
              size="sm"
              className="rounded-full h-10 w-10 p-0 flex items-center justify-center"
            >
              <MicOff size={18} />
            </Button>
          ) : (
            <>
              {!audioURL ? (
                <Button 
                  onClick={startRecording} 
                  variant="outline" 
                  size="sm"
                  className="rounded-full h-10 w-10 p-0 flex items-center justify-center"
                >
                  <Mic size={18} />
                </Button>
              ) : (
                <Button 
                  onClick={handleSend} 
                  className="rounded-full h-10 w-10 p-0 flex items-center justify-center"
                >
                  <Send size={16} />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
