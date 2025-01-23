declare module '@google-cloud/speech' {
  export class SpeechClient {
    constructor();
    recognize(request: RecognizeRequest): Promise<[{
      results?: Array<{
        alternatives?: Array<{
          transcript?: string;
        }>;
      }>;
    }]>;
  }
}

  export interface SpeechClient {
    recognize(request: RecognizeRequest): Promise<[{
      results?: Array<{
        alternatives?: Array<{
          transcript?: string;
        }>;
      }>;
    }]>;
  }


declare module '@google-cloud/text-to-speech' {
  export class TextToSpeechClient {
    constructor();
    synthesizeSpeech(request: SynthesizeSpeechRequest): Promise<[{
      audioContent: { buffer: ArrayBuffer };
    }]>;
  }
}

  export interface SynthesizeSpeechRequest {
    input: { text: string };
    voice: {
      languageCode: string;
      ssmlGender: SsmlVoiceGender;
    };
    audioConfig: {
      audioEncoding: AudioEncoding;
      pitch: number;
      speakingRate: number;
      volumeGainDb: number;
    };
  }

  export interface TextToSpeechClient {
    synthesizeSpeech(request: SynthesizeSpeechRequest): Promise<[{
      audioContent: { buffer: ArrayBuffer };
    }]>;
  }
