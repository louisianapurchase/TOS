import os
os.environ["TRANSFORMERS_CACHE"] = "C:/cache/huggingface"
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
from transformers import pipeline
from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# Initialize Flask app
app = Flask(__name__)
CORS(app)
def classify_sentiment(score):
    if score >= 80:
        return "This Policy has a healthy rating and a Very Low Malicous chance"
    elif score >= 60:
        return "This Policy has a Low Malicous Chance"
    elif score >= 40:
        return "This Policy could be malicous"
    elif score >= 20:
        return "This policy has a high chance of being Malicous"
    else:
        return "Malicious"

# Load pre-trained Hugging Face summarization model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Initialize SentimentIntensityAnalyzer for scoring (optional)
nltk.download("vader_lexicon")
sia = SentimentIntensityAnalyzer()

# Sample endpoint for summarizing and scoring TOS text
@app.route('/summarize', methods=['POST', 'OPTIONS'])
def summarize():
    if request.method == 'OPTIONS':
        # Allow the preflight request
        response = jsonify({"message": "CORS preflight check passed"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response, 200

    # Handle POST requests
    try:
        data = request.json
        tos_text = data.get("tosText", "")  # Ensure we are retrieving the text string
        print("Received TOS text:", tos_text)
        if not tos_text:
            return jsonify({"error": "No TOS text provided"}), 400

        # Summarize the TOS text using the model
        summary = summarizer(tos_text, max_length=130, min_length=30, do_sample=False)[0]["summary_text"]

        # Score the TOS text (e.g., based on sentiment or readability)
        sentiment_score = sia.polarity_scores(tos_text)["compound"]
        normalized_score = round((sentiment_score + 1) * 50)  # Convert sentiment to a 0-100 scale
        ScoreSummary = classify_sentiment(normalized_score)
        return jsonify({
            "summary": summary,
            "score": normalized_score,
            "SummaryofScore": ScoreSummary  # Scaled sentiment score
        })
    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
