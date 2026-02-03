'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Phone, Mic, MicOff, Camera, CameraOff, Loader } from 'lucide-react';
import { videoAPI } from '@/lib/api/video';
import { toast } from 'react-hot-toast';

interface VideoRoomProps {
  appointmentId: string;
  role: 'PATIENT' | 'DOCTOR';
}

export function VideoRoom({ appointmentId, role }: VideoRoomProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [participantConnected, setParticipantConnected] = useState(false);

  const roomRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const attachTrack = (track: any, container: HTMLDivElement | null) => {
    if (!container) return;
    const el = track.attach();
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.objectFit = 'cover';
    container.appendChild(el);
  };

  const detachTrack = (track: any) => {
    const elements = track.detach();
    elements.forEach((el: HTMLMediaElement) => el.remove());
  };

  const handleRemoteParticipant = useCallback((participant: any) => {
    setParticipantConnected(true);

    participant.videoTracks.forEach((publication: any) => {
      if (publication.track) {
        attachTrack(publication.track, remoteVideoRef.current);
      }
    });

    participant.on('trackPublished', (publication: any) => {
      publication.subscribe().then((track: any) => {
        if (track.kind === 'video') {
          attachTrack(track, remoteVideoRef.current);
        }
      });
    });

    participant.on('trackUnpublished', (publication: any) => {
      if (publication.track) {
        detachTrack(publication.track);
      }
    });
  }, []);

  const join = useCallback(async () => {
    setStatus('connecting');
    setErrorMessage('');

    try {
      const response = await videoAPI.getToken(appointmentId);
      const { token, roomName } = response.data!;

      // Dynamic import to avoid SSR issues with twilio-video
      const { connect } = await import('twilio-video');

      const room = await connect(token, {
        name: roomName,
        video: { width: 640, height: 360 },
        audio: true,
      });

      roomRef.current = room;
      setStatus('connected');

      // Attach local video
      room.localParticipant.videoTracks.forEach((publication: any) => {
        attachTrack(publication.track, localVideoRef.current);
      });

      // Handle existing remote participants
      room.participants.forEach(handleRemoteParticipant);

      // Handle new participants
      room.on('participantConnected', handleRemoteParticipant);
      room.on('participantDisconnected', () => setParticipantConnected(false));
    } catch (err: any) {
      setStatus('error');
      const msg = err.message || 'Failed to connect to video call';
      setErrorMessage(msg);
      toast.error(msg);
    }
  }, [appointmentId, handleRemoteParticipant]);

  const leave = useCallback(async () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (role === 'DOCTOR') {
      try {
        await videoAPI.endSession(appointmentId);
      } catch {
        // non-fatal
      }
    }
    setStatus('idle');
    setParticipantConnected(false);
  }, [appointmentId, role]);

  const toggleAudio = () => {
    if (!roomRef.current) return;
    const pub = Array.from(roomRef.current.localParticipant.audioTracks.values())[0] as any;
    if (!pub?.track) return;
    audioEnabled ? pub.track.disable() : pub.track.enable();
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = () => {
    if (!roomRef.current) return;
    const pub = Array.from(roomRef.current.localParticipant.videoTracks.values())[0] as any;
    if (!pub?.track) return;
    videoEnabled ? pub.track.disable() : pub.track.enable();
    setVideoEnabled(!videoEnabled);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  if (status === 'idle') {
    return (
      <Button className="w-full" onClick={join}>
        <Video className="h-4 w-4 mr-2" />
        Join Video Call
      </Button>
    );
  }

  if (status === 'connecting') {
    return (
      <Button className="w-full" disabled>
        <Loader className="h-4 w-4 mr-2 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-2">
        <p className="text-destructive text-sm text-center">{errorMessage}</p>
        <Button className="w-full" onClick={join}>
          <Video className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Connected state
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {/* Remote participant */}
        <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video flex items-center justify-center">
          <div ref={remoteVideoRef} className="w-full h-full" />
          {!participantConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
              <p className="text-gray-400 text-xs text-center px-2">
                Waiting for {role === 'PATIENT' ? 'Doctor' : 'Patient'}...
              </p>
            </div>
          )}
          <span className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-60 px-2 py-0.5 rounded">
            {role === 'PATIENT' ? 'Doctor' : 'Patient'}
          </span>
        </div>

        {/* Local participant */}
        <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
          <div ref={localVideoRef} className="w-full h-full" />
          <span className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-60 px-2 py-0.5 rounded">
            You
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={audioEnabled ? 'outline' : 'secondary'}
          size="sm"
          onClick={toggleAudio}
          title={audioEnabled ? 'Mute' : 'Unmute'}
        >
          {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          variant={videoEnabled ? 'outline' : 'secondary'}
          size="sm"
          onClick={toggleVideo}
          title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
        </Button>
        <Button variant="destructive" size="sm" onClick={leave} className="ml-4">
          <Phone className="h-4 w-4 mr-1" />
          {role === 'DOCTOR' ? 'End Call' : 'Leave'}
        </Button>
      </div>
    </div>
  );
}
