from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from openai import OpenAI
import os
from dotenv import load_dotenv
from pathlib import Path
import tempfile
from typing import Dict
import json
from pronunciation_analyzer import get_detailed_analysis, extract_audio_features, analyze_prosody

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def transcribe_audio(audio_file_path: str, language: str = "en") -> str:
    """
    Transcribe audio using OpenAI's Whisper API.
    
    Args:
        audio_file_path: Path to the audio file to transcribe
        language: Language code ('en' for English, 'es' for Spanish)
    
    Returns:
        Transcribed text as a string
    """
    try:
        with open(audio_file_path, "rb") as audio_file:
            # Convert speech to text
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text",
                language=language 
            )
        return transcript
    except Exception as e:
        print(f"Transcription error: {e}")
        raise

def generate_feedback(target_text: str, transcription: str, score: int, language: str = "en") -> Dict:
    """
    Generate personalized pronunciation feedback.
    
    Args:
        target_text: Target phrase
        transcription: Transcribed phrase
        score: Pronunciation score (0-100)
        language: Language code
    
    Returns:
        Dictionary with 'feedback' (main text) and 'suggestions' (list of pointers)
    """
    if language == "es":
        coach_description = "You are an expert pronunciation coach for Spanish language learners."
        language_name = "Spanish"
    else:
        coach_description = "You are an expert pronunciation coach for English language learners."
        language_name = "English"
    
    # Create prompt for feedback generation
    prompt = f"""You are an expert pronunciation coach for {language_name} language learners. 

    Target phrase: "{target_text}"
    What the student said: "{transcription}"

    Analyze the pronunciation and provide:
    1. If words are missing, remind the student to complete the phrase
    2. Provide specific feedback on pronunciation differences (focus on phonemes, word stress, intonation)
    3. Provide 2-3 actionable tips for improvement
    4. Positive reinforcement for what they did well

    Be encouraging but specific. Keep your response concise (3-4 sentences for main feedback).

    Return your response as a JSON object with this structure:
    {{
        "feedback": "main feedback text here",
        "suggestions": ["tip 1", "tip 2", "tip 3"]
    }}"""

    try:
        # Call model to generate feedback
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": coach_description},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        feedback_data = json.loads(content)
        
        return feedback_data
    
    except Exception as e:
        print(f"Feedback generation error: {e}")
        fallback_feedback = {
            "feedback": "Good effort! Keep practicing to improve your pronunciation.",
            "suggestions": [
                "Try speaking more slowly to enunciate clearly",
                "Record yourself and compare to native speakers",
                "Focus on problem sounds one at a time"
            ]
        }
        
        return fallback_feedback
    
def generate_practice_phrase(language: str, difficulty: str) -> str:    
    """
    Generate a practice phrase based on selected difficulty level.
    
    Args:
        language: 'en' or 'es'
        difficulty: 'easy', 'intermediate', or 'difficult'
    
    Returns:
        A practice phrase string
    """
    difficulty_descriptions = {
        "easy": {
            "en": "Generate a simple English phrase that a beginner would use in daily conversation. Use common, simple vocabulary and basic grammar. Examples: greetings, asking for help, expressing needs.",
            "es": "Generate a simple Spanish phrase that a beginner would use in daily conversation. Use common, simple vocabulary and basic grammar. Examples: greetings, asking for help, expressing needs."
        },
        "intermediate": {
            "en": "Generate an intermediate English phrase with moderate complexity. Include some phrasal verbs, contractions, or compound sentences. Should be conversational but more complex than beginner level.",
            "es": "Generate an intermediate Spanish phrase with moderate complexity. Include some compound tenses or subjunctive mood. Should be conversational but more complex than beginner level."
        },
        "difficult": {
            "en": "Generate an advanced English phrase with complex vocabulary, idioms, or sophisticated grammar structures. Include challenging pronunciation elements like consonant clusters or difficult vowel sounds.",
            "es": "Generate an advanced Spanish phrase with complex vocabulary, idiomatic expressions, or sophisticated grammar structures. Include challenging pronunciation elements like rolled r's or complex verb conjugations."
        }
    }
    
    prompt = difficulty_descriptions.get(difficulty, difficulty_descriptions["easy"]).get(language, difficulty_descriptions["easy"]["en"])
    prompt += "\n\nReturn ONLY the phrase itself, nothing else. No quotation marks, no explanations, just the phrase."
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a language learning expert who generates practice phrases for pronunciation."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.9,
            max_tokens=50
        )
        
        phrase = response.choices[0].message.content.strip()
        phrase = phrase.strip('"').strip("'")
        return phrase
    
    except Exception as e:
        print(f"Phrase generation error: {e}")
        fallback_phrases = {
            "easy": {
                "en": "How are you today?",
                "es": "¿Cómo estás hoy?"
            },
            "intermediate": {
                "en": "I would like to order some coffee please.",
                "es": "Me gustaría pedir un café por favor."
            },
            "difficult": {
                "en": "Could you recommend a restaurant that serves authentic cuisine?",
                "es": "¿Podrías recomendar un restaurante que sirva comida auténtica?"
            }
        }
        return fallback_phrases.get(difficulty, fallback_phrases["easy"]).get(language, fallback_phrases["easy"]["en"])

@app.post("/analyze")
async def analyze_pronunciation(
    audio: UploadFile = File(...),
    target_text: str = Form(...),
    language: str = Form("en")
):
    """
    Main endpoint: Analyze user's pronunciation in audio recording.
    
    Receives audio file and target text, returns detailed analysis.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        content = await audio.read()
        temp_audio.write(content)
        temp_audio_path = temp_audio.name
    
    try:
        # Transcribe audio recording
        transcription = transcribe_audio(temp_audio_path, language)
        
        # Analyze audio recording
        analysis = get_detailed_analysis(target_text, transcription, temp_audio_path)
        
        # Generate feedback
        feedback_data = generate_feedback(
            target_text, 
            transcription, 
            analysis["score"], 
            language
        )
        
        result = {
            "transcription": transcription,
            "score": analysis["score"],
            "feedback": feedback_data.get("feedback", ""),
            "suggestions": feedback_data.get("suggestions", []),
            "prosody_feedback": analysis["prosody_feedback"],  # NEW
            "audio_features": analysis["audio_features"]  # NEW
        }
        
        return result
    
    finally:
        # Clean temporary audio file
        if os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)

@app.post("/generate-audio")
async def generate_target_audio(
    text: str = Form(...),
    language: str = Form("en")
):
    """
    Generate audio with proper pronunciation of target phrase using OpenAI TTS
    """
    try:
        # Select voice based on language
        voice = "alloy" if language == "en" else "nova"
        
        # Generate speech
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text
        )
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_audio.write(response.content)
            temp_audio_path = temp_audio.name
        
        # Return audio file
        return FileResponse(
            temp_audio_path,
            media_type="audio/mpeg",
            filename="target_audio.mp3"
        )
    
    except Exception as e:
        print(f"TTS error: {e}")
        raise

@app.post("/generate-phrase")
async def generate_phrase_endpoint(
    language: str = Form(...),
    difficulty: str = Form(...)
):
    """
    Generate a practice phrase based on user's selected difficulty.
    """
    try:
        phrase = generate_practice_phrase(language, difficulty)
        return {"phrase": phrase}
    
    except Exception as e:
        print(f"Error generating phrase: {e}")
        raise

@app.get("/")
async def root():
    return {"message": "Pronunciation Feedback API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)