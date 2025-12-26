# Audio/Video Processing Tools - 2025 Research

*Generated via GLM research*

## Comparison Table

| Tool | Hackability | Self-Hosted | Use Case |
|------|:-----------:|:-----------:|----------|
| **FFmpeg** | **10/10** | ✅ Yes | Transcoding, format conversion, filters |
| **GStreamer** | **9/10** | ✅ Yes | Real-time streaming, WebRTC, pipelines |
| **Faster-Whisper** | **9/10** | ✅ Yes | Speech-to-text, subtitles, offline |
| **yt-dlp** | **8/10** | ✅ Yes | Video archiving, stream ripping |
| **Vosk** | **8/10** | ✅ Yes | Lightweight STT, embedded devices |
| **MLT** | **7/10** | ✅ Yes | Automated video editing, sequencing |
| **Piper TTS** | **8/10** | ✅ Yes | Text-to-speech, voice synthesis |

---

## Tier 1: The Essentials

### FFmpeg (10/10) - THE FOUNDATION
```bash
# Convert format
ffmpeg -i input.mp4 output.webm

# Extract audio
ffmpeg -i video.mp4 -vn -acodec libmp3lame audio.mp3

# Resize video
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4

# Stream camera to RTMP
ffmpeg -f v4l2 -i /dev/video0 -c:v libx264 -f flv rtmp://server/live/key

# Pipe raw frames (for programmatic video)
python generate_frames.py | ffmpeg -f rawvideo -pix_fmt rgb24 -s 1920x1080 -r 30 -i - output.mp4
```

### GStreamer (9/10) - Real-Time Pipelines
```bash
# Camera to WebRTC
gst-launch-1.0 v4l2src ! videoconvert ! x264enc ! rtph264pay ! webrtcbin

# Low-latency streaming (<200ms)
gst-launch-1.0 udpsrc port=5000 ! application/x-rtp ! rtph264depay ! decodebin ! autovideosink

# Features:
# - Plugin architecture
# - Real-time processing
# - Language bindings (Python, C, Rust)
```

### Faster-Whisper (9/10) - Local Transcription
```bash
# Install
pip install faster-whisper

# Python usage
from faster_whisper import WhisperModel
model = WhisperModel("large-v3", device="cuda")
segments, info = model.transcribe("audio.mp3")
for segment in segments:
    print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")

# CLI with whisper.cpp
./main -m models/ggml-large.bin -f audio.wav --output-srt
```

---

## Tier 2: Specialized Tools

### yt-dlp (8/10) - Stream Ripper
```bash
# Download best quality
yt-dlp -f 'bestvideo+bestaudio' URL

# Extract audio only
yt-dlp -x --audio-format mp3 URL

# Download with metadata
yt-dlp --embed-metadata --embed-thumbnail URL

# Batch download from file
yt-dlp -a urls.txt

# Post-process with FFmpeg
yt-dlp --postprocessor-args "-ss 00:01:00 -t 00:05:00" URL
```

### Vosk (8/10) - Embedded Speech Recognition
```python
from vosk import Model, KaldiRecognizer
import pyaudio

model = Model("vosk-model-small-en-us")
rec = KaldiRecognizer(model, 16000)

# Real-time microphone transcription
stream = pyaudio.PyAudio().open(format=pyaudio.paInt16, channels=1, rate=16000, input=True)
while True:
    data = stream.read(4000)
    if rec.AcceptWaveform(data):
        print(rec.Result())
```

### MLT (7/10) - Automated Video Editing
```bash
# melt command - Kdenlive/Shotcut engine
melt video1.mp4 video2.mp4 -mix 30 -mixer luma -consumer avformat:output.mp4

# Complex composition
melt color:red out=100 -track video.mp4 in=50 out=150 \
  -transition composite start="0/0:100%x100%" \
  -consumer avformat:output.mp4
```

---

## Text-to-Speech (TTS) Options

| Tool | Quality | Speed | Self-Hosted |
|------|---------|-------|:-----------:|
| **Piper** | High | Fast | ✅ Yes |
| **Fish-V** | Excellent | Medium | ✅ Yes |
| **XTTS** | Excellent | Slow | ✅ Yes |
| **Bark** | Excellent | Slow | ✅ Yes |
| ElevenLabs | Best | Fast | ❌ No (SaaS) |

### Piper TTS (8/10) - Fast Neural TTS
```bash
# Install
pip install piper-tts

# Generate speech
echo "Hello world" | piper --model en_US-lessac-medium --output_file out.wav

# Features:
# - 40+ voices
# - Runs on Raspberry Pi
# - Low latency
```

---

## Use Case Matrix

| Goal | Primary Tool | Fallback |
|------|-------------|----------|
| Convert formats | **FFmpeg** | HandBrake |
| Live streaming | **GStreamer** | OBS + FFmpeg |
| Download videos | **yt-dlp** | gallery-dl |
| Transcribe audio | **Faster-Whisper** | Vosk |
| Generate speech | **Piper** | Fish-V/XTTS |
| Auto-edit video | **MLT** | Blender Python |
| AI vision | **MediaPipe** | OpenCV |

---

## Recommended Audio/Video Stack

```
Media Processing Stack:
├── FFmpeg ─────────── Core transcoding
├── GStreamer ──────── Real-time pipelines
├── Faster-Whisper ─── Transcription
├── yt-dlp ─────────── Video archiving
├── Piper TTS ──────── Speech synthesis
├── MLT ────────────── Video sequencing
└── MediaPipe ──────── AI vision (face, pose)
```

## Installation Script

```bash
#!/bin/bash
# Install hackable media stack

# FFmpeg
brew install ffmpeg  # or apt install ffmpeg

# GStreamer
brew install gstreamer gst-plugins-base gst-plugins-good

# Faster-Whisper
pip install faster-whisper

# yt-dlp
pip install yt-dlp

# Piper TTS
pip install piper-tts

# Vosk (lightweight)
pip install vosk

# MLT
brew install mlt  # or apt install mlt-melern
```
