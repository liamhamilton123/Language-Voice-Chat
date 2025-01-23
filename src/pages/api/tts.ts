// pages/api/tts.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'

// Configure credentials in your .env or rely on default credentials
// const ttsClient = new TextToSpeechClient({
//   projectId: process.env.GCLOUD_PROJECT,
//   credentials: {
//     client_email: process.env.GCLOUD_CLIENT_EMAIL,
//     private_key: process.env.GCLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//   },
// })

const ttsClient = new TextToSpeechClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      text,
      languageCode = 'en-US',
      pitch = 0,
      speakingRate = 1.0,
      volumeGainDb = 0,
      gender = 'NEUTRAL'
    } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Missing "text" in request body' })
    }

    // Build request for Google Text-to-Speech
    const request = {
      input: { text },
      voice: {
        languageCode,
        ssmlGender: gender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch,
        speakingRate,
        volumeGainDb
      }
    }

    // Send to Google Cloud TTS
    const [response] = await ttsClient.synthesizeSpeech(request)
    const audioContent = response.audioContent

    if (!audioContent) {
      return res.status(500).json({ error: 'No audio content returned' })
    }

    // Return base64 MP3
    return res.status(200).json({ audioContent })
  } catch (error: any) {
    console.error('Text-to-speech error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
