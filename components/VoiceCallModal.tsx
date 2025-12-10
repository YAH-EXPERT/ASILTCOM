import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Contact } from '../types';
import { Mic, MicOff, PhoneOff, Video } from 'lucide-react';

interface VoiceCallModalProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onVoiceMessage: (text: string, sender: 'user' | 'contact') => void;
}

// Helper to encode PCM data to base64
function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to decode base64 to audio bytes
function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to create AudioBuffer from PCM data
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ contact, isOpen, onClose, onVoiceMessage }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [serverActive, setServerActive] = useState(false);
  
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const activeRef = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sessionRef = useRef<any>(null);
  
  // Buffers for transcription
  const userTranscriptBuffer = useRef<string>('');
  const modelTranscriptBuffer = useRef<string>('');

  useEffect(() => {
    let isMounted = true;
    
    if (isOpen) {
      activeRef.current = true;
      const timer = setTimeout(() => {
        if (isMounted) startSession();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      activeRef.current = false;
      cleanup();
    }
    
    return () => {
      isMounted = false;
      activeRef.current = false;
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (sessionRef.current) {
        sessionRef.current = null;
    }

    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }

    sourcesRef.current.forEach(s => {
        try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (e) {}
      processorRef.current = null;
    }

    if (inputContextRef.current) {
      try { inputContextRef.current.close(); } catch(e) {}
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      try { outputContextRef.current.close(); } catch(e) {}
      outputContextRef.current = null;
    }

    if (activeRef.current) {
        setStatus('ended');
        setServerActive(false);
    }
    nextStartTimeRef.current = 0;
    userTranscriptBuffer.current = '';
    modelTranscriptBuffer.current = '';
  };

  const flushTranscriptions = () => {
      if (userTranscriptBuffer.current.trim()) {
          onVoiceMessage(userTranscriptBuffer.current.trim(), 'user');
          userTranscriptBuffer.current = '';
      }
      if (modelTranscriptBuffer.current.trim()) {
          onVoiceMessage(modelTranscriptBuffer.current.trim(), 'contact');
          modelTranscriptBuffer.current = '';
      }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
        if (!activeRef.current) return;
        
        animationFrameRef.current = requestAnimationFrame(draw);
        
        analyser.getByteTimeDomainData(dataArray);
        
        ctx.fillStyle = '#0f1416'; // Clear with background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Subtle white line
        ctx.beginPath();
        
        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;
        
        for(let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;
            
            if(i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.lineTo(canvas.width, canvas.height/2);
        ctx.stroke();
    };
    
    draw();
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      // Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      try {
          await inputCtx.resume();
          await outputCtx.resume();
      } catch (e) {
          console.warn("AudioContext resume failed", e);
      }

      // Get Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true,
          } 
      });
      streamRef.current = stream;

      // Determine System Instruction based on Contact
      let systemInstruction = `You are simulating a voice call with a friend named ${contact.name}. Your number is ${contact.phoneNumber}. Keep responses conversational, concise, and natural.`;

      if (contact.id === 'ai-nara') {
        systemInstruction = `Tu es Nara, une femme africaine métisse, intelligente, rassurante et séduisante. Ton ton est doux et envoûtant. Tu parles français. Sois concise et naturelle comme dans un vrai appel vocal.`;
      } else if (contact.id === 'ai-yah') {
        systemInstruction = `Tu es YAH, l'IA de Madagascar. Tu parles couramment le Malgache et le Français. Tu es poli, sage et chaleureux (Fihavanana).`;
      } else if (contact.id === 'dev-marc') {
        systemInstruction = `You are Marc, a cynical but brilliant Backend Engineer. Short, direct answers. You use technical jargon.`;
      } else if (contact.id === 'dev-sarah') {
        systemInstruction = `You are Sarah, a cheerful Frontend Lead. Enthusiastic and helpful tone.`;
      } else if (contact.id === 'dev-alex') {
        systemInstruction = `You are Alex, a DevOps Engineer. Structured, reliable, slightly robotic tone.`;
      }

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (!activeRef.current) return;
            console.log("Gemini Live Session Opened");
            setStatus('connected');
            
            const source = inputCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            // Analyser for Visualizer
            const analyser = inputCtx.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            analyserRef.current = analyser;
            
            // Start Visualizer
            drawVisualizer();

            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              if (!activeRef.current || isMuted) return;

              const inputData = e.inputBuffer.getChannelData(0);
              
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const uint8 = new Uint8Array(int16.buffer);
              const base64Data = encodeAudio(uint8);

              sessionPromise.then(session => {
                 try {
                     session.sendRealtimeInput({
                        media: {
                            mimeType: 'audio/pcm;rate=16000',
                            data: base64Data
                        }
                     });
                 } catch (err) {
                     console.error("Error sending audio data", err);
                 }
              }).catch(err => {
                  console.error("Session promise error", err);
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!activeRef.current) return;

            if (message.serverContent?.inputTranscription) {
                userTranscriptBuffer.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
                modelTranscriptBuffer.current += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
                flushTranscriptions();
            }

            const modelTurn = message.serverContent?.modelTurn;
            if (modelTurn) {
                const parts = modelTurn.parts;
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.data) {
                         setServerActive(true);
                         const base64Audio = part.inlineData.data;
                         
                         nextStartTimeRef.current = Math.max(
                            nextStartTimeRef.current,
                            outputCtx.currentTime
                         );

                         try {
                             const audioBytes = decodeAudio(base64Audio);
                             const audioBuffer = await decodeAudioData(audioBytes, outputCtx, 24000, 1);
                             
                             const source = outputCtx.createBufferSource();
                             source.buffer = audioBuffer;
                             source.connect(outputCtx.destination);
                             
                             source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) {
                                    setServerActive(false);
                                }
                             });

                             source.start(nextStartTimeRef.current);
                             nextStartTimeRef.current += audioBuffer.duration;
                             sourcesRef.current.add(source);
                         } catch (e) {
                             console.error("Audio decode error", e);
                         }
                    }
                }
            }

            if (message.serverContent?.interrupted) {
                console.log("Model interrupted");
                flushTranscriptions();

                sourcesRef.current.forEach(s => {
                    try { s.stop(); } catch(e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = outputCtx.currentTime;
                setServerActive(false);
            }
          },
          onclose: () => {
             console.log("Session closed");
             flushTranscriptions();
             if (activeRef.current) setStatus('ended');
          },
          onerror: (err) => {
             console.error("Session error", err);
             if (activeRef.current) setStatus('error');
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            // Fix: Transcription configs must be empty objects to enable them, without 'model' field
            inputAudioTranscription: {}, 
            outputAudioTranscription: {},
            systemInstruction: systemInstruction
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (e) {
      console.error("Connection failed", e);
      setStatus('error');
    }
  };

  const handleMuteToggle = () => {
      setIsMuted(prev => !prev);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center bg-[#0f1416] text-white">
        {/* Ambient Background */}
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-[#00a884] opacity-5 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#53bdeb] opacity-5 blur-[100px]"></div>

        {/* Header */}
        <div className="w-full p-6 flex justify-between items-center z-10">
            <div className="text-gray-400 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider">End-to-end Encrypted</span>
            </div>
             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20">
                 <span className="text-lg">+</span>
             </div>
        </div>

        {/* Call Info */}
        <div className="flex-1 flex flex-col items-center justify-center w-full z-10 pb-10">
            <div className="relative mb-8">
                {/* Speaking Ring */}
                {status === 'connected' && serverActive && (
                    <div className="absolute inset-0 rounded-full border-2 border-[#00a884]/50 animate-pulse-ring scale-150"></div>
                )}
                <img 
                    src={contact.avatarUrl || `https://picsum.photos/seed/${contact.id}/200`} 
                    alt={contact.name}
                    className="w-32 h-32 rounded-full object-cover border-2 border-white/10 relative z-10 shadow-2xl"
                />
            </div>
            
            <h2 className="text-3xl font-medium mb-2">{contact.name}</h2>
            <p className={`text-lg font-light ${status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                {status === 'connecting' && 'Connecting...'}
                {status === 'connected' && (serverActive ? 'Speaking...' : 'Listening...')}
                {status === 'ended' && 'Call Ended'}
                {status === 'error' && 'Connection Failed. Check Network.'}
            </p>

            {/* Visualizer Canvas */}
            <div className="mt-8 h-16 w-full max-w-xs flex items-center justify-center">
                {status === 'connected' && (
                    <canvas 
                        ref={canvasRef} 
                        width={320} 
                        height={64} 
                        className="w-full h-full"
                    />
                )}
            </div>
        </div>

        {/* Controls */}
        <div className="w-full bg-[#1f2c34] rounded-t-3xl p-6 pb-10 flex justify-around items-center z-20">
             <button className="p-3 text-gray-400 hover:bg-white/5 rounded-full transition-colors">
                <Video className="w-6 h-6" />
             </button>
             
             <button 
                onClick={handleMuteToggle}
                className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
             >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
             </button>

             <button 
                onClick={onClose}
                className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
             >
                <PhoneOff className="w-7 h-7 text-white fill-current" />
             </button>
        </div>
    </div>
  );
};