import librosa
import numpy as np
from typing import Dict, Tuple
import jellyfish

def extract_audio_features(audio_path: str) -> Dict:
    """
    Extract features from audio file.
    
    Args:
        audio_path: Path to audio file
        
    Returns:
        Dictionary of audio features
    """
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=16000)
        
        # Extract features
        features = {            
            # Volume
            "rms_energy": float(np.mean(librosa.feature.rms(y=y))),
            
            # Spectral features
            "spectral_centroid": float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))),
            
            # Zero crossing rate (indicator of pronunciation clarity)
            "zcr": float(np.mean(librosa.feature.zero_crossing_rate(y))),
        }
        
        return features
    
    except Exception as e:
        print(f"Feature extraction error: {e}")
        return {}


def analyze_prosody(features: Dict, target_text: str) -> list:
    """
    Analyze rhythm, stress, and intonation, then provide feedback.
    
    Args:
        features: Audio features from extract_audio_features
        target_text: Target phrase
        
    Returns:
        List of feedback strings
    """
    feedback = []
    
    # Estimate expected duration (~3 chars per second for normal speech)
    expected_duration = len(target_text) / 12  # ~12 chars per second
    actual_duration = features.get("duration", 0)
    
    if actual_duration > expected_duration * 1.5:
        feedback.append("Try speaking a bit faster for more natural rhythm")
    elif actual_duration < expected_duration * 0.6:
        feedback.append("Slow down slightly to improve clarity and enunciation")
    
    # Volume analysis
    if features.get("rms_energy", 0) < 0.01:
        feedback.append("Speak with more volume and confidence")
    elif features.get("rms_energy", 0) > 0.2:
        feedback.append("Try to moderate your volume slightly")
    
    # Zero crossing rate
    if features.get("zcr", 0) > 0.15:
        feedback.append("Focus on clear articulation of consonants")
    
    return feedback


def calculate_advanced_score(target_text: str, transcription: str, audio_features: Dict) -> int:
    """
    Calculate pronunciation score using various metrics.
    
    Args:
        target_text: Expected text
        transcription: Transcribed phrase
        audio_features: Extracted audio features
        
    Returns:
        Score from 0-100
    """
    target_lower = target_text.lower().strip()
    transcription_lower = transcription.lower().strip()
    
    # Checks for exact match between target phrase and transcribed phrase
    if target_lower == transcription_lower:
        return 100
    
    # Text similarity
    target_words = target_lower.replace("'", "").replace("?", "").replace(",", "").replace("¿", "").split()
    transcribed_words = transcription_lower.replace("'", "").replace("?", "").replace(",", "").replace("¿", "").split()
    
    if not target_words:
        return 0
    
    # Word overlap score
    matching_words = set(target_words).intersection(set(transcribed_words))
    word_score = (len(matching_words) / len(target_words)) * 100
    
    # Phonetic similarity
    jaro_score = jellyfish.jaro_winkler_similarity(target_lower, transcription_lower) * 100
    
    # Levenshtein distance
    lev_distance = jellyfish.levenshtein_distance(target_lower, transcription_lower)
    max_len = max(len(target_lower), len(transcription_lower))
    lev_score = (1 - (lev_distance / max_len)) * 100 if max_len > 0 else 0
    
    # Prosody (fluency) penalty/bonus
    prosody_score = 100
    if audio_features:
        # Penalize if speaking too fast or too slow
        expected_duration = len(target_text) / 12
        actual_duration = audio_features.get("duration", expected_duration)
        duration_ratio = actual_duration / expected_duration if expected_duration > 0 else 1
        
        if duration_ratio > 1.5 or duration_ratio < 0.6:
            prosody_score = 85
        elif duration_ratio > 1.3 or duration_ratio < 0.7:
            prosody_score = 90
    
    # Weighted average
    final_score = (
        word_score * 0.40 +      
        jaro_score * 0.25 +      
        lev_score * 0.20 +       
        prosody_score * 0.15     
    )
    
    return min(int(final_score), 100)


def get_detailed_analysis(target_text: str, transcription: str, audio_path: str) -> Dict:
    """
    Complete analysis combining all metrics.
    
    Args:
        target_text: Expected text
        transcription: Transcribed phrase
        audio_path: Path to audio file
        
    Returns:
        Dictionary with score, features, and feedback
    """
    audio_features = extract_audio_features(audio_path)
    score = calculate_advanced_score(target_text, transcription, audio_features)
    prosody_feedback = analyze_prosody(audio_features, target_text)
    
    return {
        "score": score,
        "audio_features": audio_features,
        "prosody_feedback": prosody_feedback
    }