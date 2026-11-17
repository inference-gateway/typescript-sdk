# Audio Example

This example demonstrates the audio endpoints of the Inference Gateway SDK: it
synthesizes speech with `createSpeech`, generates a sound effect with
`createSFX` both from a prompt and by scoring a video, and composes a music
clip with `createMusic`. All three methods return a `Blob`, which the example
writes to an audio file (`speech.mp3`, `sfx.mp3`, `video-score.mp3`,
`music.mp3`).

## Getting Started

1. Ensure you have the Inference Gateway running locally or have access to an
   instance. If not, please read the [Quick Start](../README.md#quick-start)
   section in the main README.

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Set the required environment variables:

   ```bash
   export PROVIDER=openai
   export LLM=gpt-4o-mini-tts
   ```

4. Run the example:

   ```bash
   npm start
   ```

## Notes

- Not every provider or model supports audio generation - unsupported
  combinations return a gateway error rather than a `Blob`. The example runs
  the four calls on the same `PROVIDER` / `LLM` and keeps going when one
  fails, so pick a model for the call you care about most.
- `createSpeech` (`/audio/speech`): `PROVIDER=openai` with `LLM=gpt-4o-mini-tts`
  or `tts-1`, and a built-in voice such as `alloy`, `ash`, `ballad`, `coral`,
  `echo`, `fable`, `nova`, `onyx`, `sage`, `shimmer` or `verse`. ElevenLabs
  also supports it - its `voice` is a voice id, including a cloned one.
- `createSFX` (`/audio/sfx`): `PROVIDER=elevenlabs` with
  `LLM=eleven_text_to_sound_v2` for a prompt-driven effect, or
  `LLM=music_v2_5` for video scoring. The `video` field takes an https URL or
  a base64 data URI; `output` selects the returned track (`mix`, `sfx` or
  `speech`) and defaults to `mix`. The example requests the `sfx` track from
  a public sample video and writes `video-score.mp3`.
- `createMusic` (`/audio/music`): `PROVIDER=elevenlabs` with
  `LLM=music_v2_5`. `duration_seconds` is optional and `instrumental: true`
  guarantees a clip without vocals.
- `response_format` defaults to `mp3` on all three endpoints; supported
  formats are `CreateSpeechRequestResponse_format`, `CreateSFXRequestOutput`
  and `CreateSFXRequestResponse_format` in the generated types.
