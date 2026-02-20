/**
 * ElevenLabs Text-to-Speech Integration
 * Generates high-quality voiceovers for marketing videos
 */

interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string; // Default: 'ErXwobaYp3GgM60xLJ2t' (Bella - professional female)
}

interface VoiceoverOptions {
  text: string;
  voiceId?: string;
  stability?: number; // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
}

interface VoiceoverResult {
  success: boolean;
  audioBuffer?: Buffer;
  audioUrl?: string;
  duration?: number; // in seconds
  error?: string;
}

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - professional female (standard)
const API_URL = 'https://api.elevenlabs.io/v1';

export class ElevenLabsClient {
  private apiKey: string;
  private defaultVoiceId: string;

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
    this.defaultVoiceId = config.voiceId || DEFAULT_VOICE_ID;
  }

  /**
   * Generate voiceover from text
   */
  async generateVoiceover(options: VoiceoverOptions): Promise<VoiceoverResult> {
    try {
      const voiceId = options.voiceId || this.defaultVoiceId;
      
      if (!this.apiKey) {
        return {
          success: false,
          error: 'ElevenLabs API key not configured',
        };
      }

      const response = await fetch(
        `${API_URL}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: options.text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: options.stability ?? 0.5,
              similarity_boost: options.similarityBoost ?? 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `ElevenLabs API error: ${response.status} - ${error}`,
        };
      }

      const audioBuffer = await response.arrayBuffer();
      
      // Estimate duration (rough: 150 words per minute = 2.5 chars per second)
      const estimatedDuration = Math.ceil(options.text.length / 2.5);

      return {
        success: true,
        audioBuffer: Buffer.from(audioBuffer),
        duration: estimatedDuration,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate voiceover',
      };
    }
  }

  /**
   * List available voices
   */
  async getVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return [];
    }
  }
}

/**
 * Singleton instance
 */
let client: ElevenLabsClient | null = null;

export function getElevenLabsClient(): ElevenLabsClient {
  if (!client) {
    const apiKey = process.env.ELEVENLABS_API_KEY || '';
    client = new ElevenLabsClient({ apiKey });
  }
  return client;
}
