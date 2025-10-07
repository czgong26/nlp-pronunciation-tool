# AI-Driven Pronunciation Tool

## Overview

This is a web application tool for users to check their pronunciation and fluency in a specified language (as of now, only English and Spanish are supported). Users can test their pronunciation by inputting specific vocabulary/phrases or practicing on generated phrases based on selected proficiency level. Users will submit an audio recording of their reading of the word/phrase, and a score and actionable feedback will be provided in response. If a user's pronunciation is not entirely accurate, an audio recording with the correct pronunciation and intonation will be provided as well.

## Tech Stack

Frontend: React, Lucide React, Tailwind CSS, Web Audio API

Backend: FastAPI, OpenAI Whisper/TTS/GPT-4, Librosa, Jellyfish

Analysis Tools: Jaro-Winkler similarity for phonetic matching, Levenshtein distance for edit-based scoring, spectral analysis (spectral centroid, zero-crossing rate), prosody metrics for fluency/tempo/rhythm, RMS energy/volume analysis

## Backend Setup

1. Go to the root directory of the project and install dependencies

```
pip install -r requirements.txt
```

2. Create an OpenAI API key: 

3. Create a .env file with your OpenAI API key

```
OPENAI_API_KEY=your_api_key_here
```

4. Run server

```
python main.py
```

The backend will run on http://localhost:8000

## Frontend Setup

1. Install dependencies

```
cd pronunciation-frontend
npm install
```

2. Start React server

```
npm start
```

The frontend will run on http://localhost:3000

## Future Directions

There are plenty of ways to expand on this tool. First is to expand it such that it can detect and support any language and dialect. For instance, there are dialectical differences between how Spanish is spoken in Central America, Latin America, and Spain Second is to find an alternative to OpenAI's TTS such that the speech generation is more accurate and consistent; OpenAI's TTS works best with English and struggles quite frequently with foreign languages. Lastly, there is opportunity to develop a more sophisticated scoring criterion.

## Contact

For any questions, please email at czgong@wharton.upenn.edu