
import React, { useState, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  Paperclip, 
  Image, 
  File, 
  Mic, 
  Camera,
  X,
  Play,
  Pause,
  StopCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentMenuProps {
  onFileSelect: (file: File) => void;
  onAudioRecorded: (audioBlob: Blob) => void;
  triggerClassName?: string;
}

export function AttachmentMenu({ 
  onFileSelect, 
  onAudioRecorded,
  triggerClassName 
}: AttachmentMenuProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Reset timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Set up timer
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const playPauseAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  
  const sendAudio = () => {
    if (audioURL) {
      fetch(audioURL)
        .then(r => r.blob())
        .then(audioBlob => {
          onAudioRecorded(audioBlob);
          cancelAudio();
          setIsOpen(false);
        });
    }
  };
  
  const cancelAudio = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setRecordingTime(0);
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
      setIsOpen(false);
      e.target.value = '';
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <>
      {audioURL && (
        <audio 
          ref={audioRef} 
          src={audioURL} 
          onEnded={handleAudioEnded} 
          className="hidden"
        />
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
        accept="image/*,video/*"
      />
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("text-eclipse-muted hover:text-eclipse-text", triggerClassName)}
            type="button"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 border-eclipse-border bg-eclipse-card" 
          align="end"
          side="top"
        >
          {!isRecording && !audioURL ? (
            <div className="p-4">
              <h3 className="font-medium mb-4 text-sm">Attach Files</h3>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center h-auto py-3 border-eclipse-border"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Image className="h-6 w-6 mb-2 text-eclipse-primary" />
                  <span className="text-xs">Photo/Video</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center h-auto py-3 border-eclipse-border"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <File className="h-6 w-6 mb-2 text-eclipse-primary" />
                  <span className="text-xs">Document</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center h-auto py-3 border-eclipse-border"
                  onClick={startRecording}
                >
                  <Mic className="h-6 w-6 mb-2 text-eclipse-primary" />
                  <span className="text-xs">Audio</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-sm">
                  {isRecording ? "Recording Audio..." : "Audio Preview"}
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={cancelAudio}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {isRecording ? (
                <div className="bg-eclipse-background p-4 rounded-md">
                  <div className="flex items-center justify-center mb-2">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                    <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                  </div>
                  <Button 
                    variant="default" 
                    className="w-full bg-eclipse-primary hover:bg-eclipse-primary/90"
                    onClick={stopRecording}
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              ) : audioURL ? (
                <div className="bg-eclipse-background p-4 rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={playPauseAudio}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="h-1 flex-1 mx-3 bg-eclipse-border rounded overflow-hidden">
                      <div className="h-full bg-eclipse-primary" style={{ width: "0%" }}></div>
                    </div>
                    <span className="text-xs text-eclipse-muted">{formatTime(recordingTime)}</span>
                  </div>
                  <Button 
                    variant="default" 
                    className="w-full bg-eclipse-primary hover:bg-eclipse-primary/90"
                    onClick={sendAudio}
                  >
                    Send Audio
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
