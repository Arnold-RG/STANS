import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Square, Download, Play, Pause } from "lucide-react";
import { toast } from "sonner";

const AnimationRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const canvas = document.querySelector('canvas');
      const svgElement = document.querySelector('svg[class*="graph-visualization"]');
      
      let stream: MediaStream;

      if (canvas) {
        stream = (canvas as HTMLCanvasElement).captureStream(30);
      } else if (svgElement) {
        const captureArea = svgElement.closest('.space-y-4') as HTMLElement;
        if (!captureArea) {
          toast.error("Could not find visualization area to record");
          return;
        }
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
      } else {
        toast.error("No canvas or SVG found to record");
        return;
      }

      const options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        toast.success("Recording saved successfully!");
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("Recording started!");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast.info("Recording paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      toast.info("Recording resumed");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const downloadRecording = (format: 'webm' | 'mp4') => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph-animation-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as ${format.toUpperCase()}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-6 h-6" />
          Animation Recorder
        </CardTitle>
        <CardDescription>
          Record and export graph algorithm animations to video format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <Button onClick={startRecording} size="lg" className="flex-1">
              <Video className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <Button onClick={pauseRecording} variant="secondary" size="lg" className="flex-1">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={resumeRecording} variant="secondary" size="lg" className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button onClick={stopRecording} variant="destructive" size="lg" className="flex-1">
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            </>
          )}
        </div>

        {isRecording && (
          <div className="flex items-center justify-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              <span className="font-mono text-lg font-semibold">
                {formatTime(recordingTime)}
              </span>
            </div>
            <Badge variant="destructive">
              {isPaused ? 'PAUSED' : 'RECORDING'}
            </Badge>
          </div>
        )}

        {recordedBlob && !isRecording && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Recording saved</p>
              <p className="font-mono text-sm">
                Duration: {formatTime(recordingTime)} | Size: {(recordedBlob.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => downloadRecording('webm')} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download WEBM
              </Button>
              <Button onClick={() => downloadRecording('mp4')} variant="secondary" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download MP4
              </Button>
            </div>

            <video 
              src={URL.createObjectURL(recordedBlob)} 
              controls 
              className="w-full rounded-lg border"
            />
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Navigate to a visualization tab before recording</li>
            <li>Run an algorithm to capture the animation</li>
            <li>Use the controls to step through or auto-play</li>
            <li>Click Start Recording when ready</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimationRecorder;