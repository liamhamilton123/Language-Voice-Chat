// pages/api/speech.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { SpeechClient } from '@google-cloud/speech'

// Configure credentials in your .env or rely on default credentials
// For example:
// const speechClient = new SpeechClient({
//   projectId: process.env.GCLOUD_PROJECT,
//   credentials: {
//     client_email: process.env.GCLOUD_CLIENT_EMAIL,
//     private_key: process.env.GCLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//   },
// })

const speechClient = new SpeechClient() // if your environment is already authenticated

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { audioContent, languageCode = 'en-US' } = req.body

    if (!audioContent) {
      return res.status(400).json({ error: 'Missing audioContent in request body' })
    }

    // Build the request object for Google Speech-to-Text
    const request = {
      audio: { content: audioContent }, // Base64 string
      config: {
        encoding: 'LINEAR16',  // or whatever matches your audio data
        sampleRateHertz: 48000, 
        languageCode
      }
    }

    // Send to Google Cloud Speech-to-Text
    const [response] = await speechClient.recognize(request)
    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join('\n')

    return res.status(200).json({ transcription: transcription || '' })
  } catch (error: any) {
    console.error('Speech-to-text error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
