
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Skip local checks for now
env.allowLocalModels = false;
env.useBrowserCache = true;

class MyTranscriptionPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny.en';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const message = event.data;

    // Load Model
    if (message.type === 'load') {
        try {
            await MyTranscriptionPipeline.getInstance(x => {
                self.postMessage({ type: 'progress', data: x });
            });
            self.postMessage({ type: 'ready' });
        } catch (err) {
            self.postMessage({ type: 'error', data: err.message });
        }
        return;
    }

    // Process Audio
    if (message.type === 'audio') {
        const transcriber = await MyTranscriptionPipeline.getInstance();
        const audio = message.audio; // Float32Array

        try {
            const output = await transcriber(audio, {
                language: 'english',
                task: 'transcribe',
                chunk_length_s: 30,
                stride_length_s: 5,
            });

            self.postMessage({
                type: 'result',
                text: output.text
            });
        } catch (err) {
            self.postMessage({ type: 'error', data: err.message });
        }
    }
});
