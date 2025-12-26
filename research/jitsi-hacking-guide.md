This is a deep dive into the architecture of Jitsi Meet, focusing on modifying the core JavaScript (lib-jitsi-meet and Jitsi Meet Web).

**Prerequisites:**
*   **Environment:** Node.js, npm.
*   **Source:** Clone the repo: `git clone https://github.com/jitsi/jitsi-meet.git`.
*   **Key Distinction:**
    *   **lib-jitsi-meet:** The low-level API handling WebRTC, signaling, and tracks. This is where you do logic.
    *   **react-sdk/root:** The UI layer. This is where you do skinning and buttons.

---

### 1. How to Add Custom Video Processing (e.g., Filters, Blur)

Jitsi treats video tracks as distinct objects. To process video, you generally intercept the track before it is sent to the conference (pre-processing) or manipulate the canvas rendering it.

**Approach:** The `createLocalTracks` function allows you to pass constraints or effects. However, for true pixel-manipulation, the modern approach is using the Jitsi Stream Effects (JSE) library or manually hooking into the track.

**Code Example (Basic Noise Injection via `lib-jitsi-meet`):**
This is a simplified conceptual example of how you would wrap a track to modify its frames. In a real-world scenario, you would use an `RTCInsertableStreams` (Encoded Transform) API or a Canvas-based interceptor.

```javascript
// In your custom app or lib-jitsi-meet modification
import { JitsiMeetJS } from 'lib-jitsi-meet';

JitsiMeetJS.init();

// 1. Initialize options
const options = {
    devices: {
        audio: true,
        video: true
    },
    constraints: {
        video: {
            height: 720,
            width: 1280
        }
    }
};

// 2. Create tracks
JitsiMeetJS.createLocalTracks(options).then(tracks => {
    const videoTrack = tracks.find(t => t.getType() === 'video');
    
    // HYPOTHETICAL: Jitsi tracks are wrappers around MediaStreamTrack.
    // To apply effects (like TensorFlow.js body segmentation), 
    // you typically use a library like JitsiStreamEffects.
    
    // Example: Injecting an effect using the official 'JitsiStreamEffects' logic
    // You would usually import 'jitsi-meet-electron-utils' or similar for effects.
    // Here is how you manually replace the track with a canvas output (Conceptual):
    
    applyMyCustomFilter(videoTrack.getOriginalStream()).then(processedStream => {
        // Replace the underlying track in the Jitsi wrapper
        videoTrack.setTrack(processedStream.getVideoTracks()[0]);
        
        // 3. Join room
        const room = connection.initJitsiConference("conference123", "password");
        room.addTrack(videoTrack); 
    });
});
```

*Ref: To do this easily today, use the `@jitsi/riotjs-processor` or WebAssembly filters integrated into the `JitsiLocalTrack` class.*

---

### 2. How to Build an E2E Encryption Plugin

Jitsi currently supports E2EE via WireGuard/Insertable Streams. The architecture relies on a "Cryptor" class that handles `TransformStream`.

**Approach:** You need to inject a custom `E2EEncryption` implementation. The `lib-jitsi-meet` module `JitsiMeetE2EE` handles the key generation and frame encryption/decryption.

**Code Example (Custom Cryptor Implementation):**

This assumes you have enabled `e2ee: true` in config.

```javascript
import { JitsiMeetE2EE } from 'lib-jitsi-meet';

class MyCustomCryptor {

    constructor(sender) {
        this.sender = sender;
        // Import your WebAssembly crypto module here
        this.cryptoModule = new MyWasmCrypto(); 
    }

    // Encode (Encrypt) outgoing video/audio
    async encode(encodedFrame, controller) {
        const data = new Uint8Array(encodedFrame.data);
        
        // 1. Encrypt the bytes using your custom algo
        const encrypted = await this.cryptoModule.encrypt(
            data, 
            this.sender.getCurrentKey()
        );

        // 2. Enqueue the encrypted frame
        encodedFrame.data = encrypted;
        controller.enqueue(encodedFrame);
    }

    // Decode (Decrypt) incoming video/audio
    async decode(encodedFrame, controller) {
        const data = new Uint8Array(encodedFrame.data);
        
        // 1. Decrypt
        const decrypted = await this.cryptoModule.decrypt(
            data, 
            this.sender.getRemoteKey()
        );

        encodedFrame.data = decrypted;
        controller.enqueue(encodedFrame);
    }
}

// Integration Point
// You must register this handler before the conference starts
// This requires accessing the internal E2EE context or 
// extending JitsiMeetE2EE.
```
*Note: Modifying the actual E2E implementation requires forking `lib-jitsi-meet` as the encryption pipeline instantiation is tightly coupled there.*

---

### 3. How to Add AI Features

The best place for AI (Sentiment Analysis, Transcription, Object Detection) is the **Middleware** or **Client-Side Post-Processing**.

**Approach:** Don't process video inside the `lib-jitsi` loop (it kills performance). Create a parallel worker that grabs the canvas frame or audio context.

**Code Example (Sentiment Analysis on Audio):**

```javascript
// Using a WebWorker to keep the UI smooth
// worker.js
import { pipeline } from '@xenova/transformers';

// Analyze audio stream for sentiment
async function analyzeAudio(audioTrack) {
    // 1. Load AI model (e.g., via Transformers.js)
    const classifier = await pipeline('sentiment-analysis');
    
    const stream = audioTrack.getOriginalStream();
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = async (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to input suitable for model
        // This is computationally expensive, so throttle this!
        
        // const result = await classifier(processAudioBuffer(inputData));
        // sendToChat(result); // "User is Happy"
    };
}
```

**UI Integration:**
You would inject this code into the `conference.js` lifecycle in `Jitsi Meet Web` (`react/features/conference`) and render the sentiment as an icon next to the user's video.

---

### 4. How to Skin and Rebrand

This is done via **Customizing the Config** and **Overriding CSS**. You do **not** need to recompile the React app for basic changes, but for deep structural changes, you do.

**Approach A: The Config File (Easy)**
Edit `config.js` in your deployment.

```javascript
// config.js
var config = {
    hosts: {
        domain: 'meet.my-company.com'
    },
    brandingRoomAlias: 'MyCompany', // Watermark
    // Custom JSON data for UI
    customBranding: {
        logoClickUrl: 'https://my-company.com',
        logoUrl: 'https://my-company.com/logo.png'
    }
};
```

**Approach B: CSS Variables (The Modern Way)**
If you are building from source, modify `react/features/base/ui/fonts.scss` or override `.cssroot`.

**Approach C: React Plugin (Advanced)**
You can inject a custom Header/Footer using the API without touching the core source.

```javascript
// In your entry point or loader
import { API } from './modules/UI/API';

const myToolbarButton = {
    icon: 'https://example.com/my-icon.svg',
    id: 'my-custom-btn',
    text: 'Buy Premium',
    onClick: () => window.open('https://store.com')
};

// Inject into existing UI
API.addToolbarButton(myToolbarButton);
```

**Replacing the Logo completely:**
Fork the repo, go to `react/features/branding/components/WebBranding.tsx`. Change the `SVG` or `Image` imports to your local assets.

---

### 5. How to Add Recording Features

Jitsi has two modes:
1.  **Local Recording:** Records the file to the user's disk (WebM).
2.  **Remote Recording:** Sends streams to Jibri (Java Backend).

**Approach: Local Recording (Client-side)**

You can hook into the `JitsiConference` object to record streams locally using the `MediaRecorder` API.

```javascript
// Feature: Local Recorder
function startLocalRecording(conference) {
    // 1. Get all participant streams (mixed)
    // Note: lib-jitsi doesn't easily give a "mixed" stream client-side 
    // without the Jibri infrastructure. 
    // Instead, we record the REMOTE streams individually or use canvas capture.
    
    const recorderData = [];
    
    conference.getParticipantsWithoutMe().forEach(participant => {
        const tracks = participant.getTracks();
        // Logic to concatenate streams or record separately
        // This is complex; usually, we record the specific <video> DOM element.
    });

    // EASIER ALTERNATIVE: Record the 'mixed' DOM element
    const videoElement = document.getElementById('largeVideoElement');
    
    if (videoElement.captureStream) {
        const canvasStream = videoElement.captureStream();
        const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recorderData.push(event.data);
            }
        };
        
        mediaRecorder.start();
        
        // Save logic
        mediaRecorder.onstop = () => {
            const blob = new Blob(recorderData, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'meeting.webm';
            a.click();
        };
    }
}
```

**Approach: Remote Recording (Jibri integration)**
If you want to record to MP4/Cloud, you must use the **Jibri** service or **Turbine**. You cannot do this purely in the browser JS unless you upload the Local Recording blob to your server via XHR/Fetch in real-time (chunks).

### Summary of Hackability

| Feature | Ease | Location |
| :--- | :--- | :--- |
| **Video Processing** | Hard | `lib-jitsi-meet` / `JitsiLocalTrack` |
| **E2E Encryption** | Very Hard | `lib-jitsi-meet` / `TransformStream` |
| **AI Features** | Medium | `react-sdk` (Client) or Middleware |
| **Skinning** | Easy | CSS / `config.js` |
| **Recording** | Medium | `MediaRecorder` API |
