import os
from transformers import pipeline
from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# Initialize environment variables
os.environ["TRANSFORMERS_CACHE"] = "C:/Users/aaron/.cache/huggingface"

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Function to classify sentiment based on a score (risk level)
def classify_sentiment(score):
    if score >= 80:
        return "Healthy Policy"
    elif score >= 60:
        return "Low Risk"
    elif score >= 40:
        return "Moderate Risk"
    elif score >= 20:
        return "High Risk"
    else:
        return "Very High Risk"

# Function to classify legal risk based on key phrases
def classify_risk(tos_text):
    risk_factors = {
        
    "GDPR Compliance": [
        "GDPR",
        "data protection",
        "right to be forgotten"
    ],
    "Liability Clauses": [
        "liability",
        "indemnity",
        "hold harmless"
    ],
    "Data Sharing": [
        "third-party sharing",
        "data sharing",
        "advertisers",
        "share your data with affiliated companies",
        "access to your data by government agencies",
        "partners and vendors accessing your data",
        "unnamed third-party partners"
    ],
    "User Rights": [
        "access rights",
        "control",
        "opt-out",
        "cannot delete your account",
        "limited privacy settings",
        "no way to delete your associated data",
        "privacy policy updates without notice"
    ],
    "Data Collection": [
        "sensitive personal information",
        "behavioral data",
        "location data",
        "data from third-party sources",
        "data collected when offline",
        "all data you provide",
        "tracking browsing history and interactions"
    ],
    "Data Usage": [
        "profiling",
        "personalized ads",
        "automated decisions",
        "targeted advertising",
        "data used for any purpose",
        "data combined with other sources",
        "data sold to third parties"
    ],
    "Data Retention": [
        "retain your data indefinitely",
        "backup copies",
        "data storage outside jurisdiction",
        "stored in weak data protection regions"
    ],
    "Tracking Technologies": [
        "cookies",
        "tracking technologies",
        "browser fingerprinting",
        "Do Not Track",
        "website tracking your activity",
        "invasive tracking technologies",
        "third-party trackers"
    ],
    "Security Risks": [
        "unauthorized access",
        "unsecured databases",
        "data breaches",
        "no guarantees of safety",
        "not responsible for privacy violations",
        "data transmitted without encryption"
    ],
    "User Consent": [
        "automatic agreement",
        "no opt-out options",
        "cannot delete account",
        "policy updates without notice",
        "consent implied through service usage"
    ],
    "Legal Terms": [
        "binding arbitration",
        "class-action waiver",
        "laws of weak user protections",
        "waive your right to hold us accountable",
        "governed by laws in other jurisdictions"
    ],
    "Children's Privacy": [
        "data from children under 13",
        "targeted advertising to children",
        "collecting children’s data without parental consent"
    ],
    "Vague or Misleading Terms": [
        "necessary data",
        "improve our services",
        "policy subject to interpretation",
        "terms open to interpretation",
        "use your data as determined by us"
    ],
    "Behavioral and Emotional Profiling": [
        "analyze your emotions",
        "predict your behavior",
        "psychological profiling shared with third parties"
    ],
    "Right to Modify Terms": [
        "modify terms without notice",
        "implied acceptance of changes",
        "unilateral changes to the policy"
    ]

}
    

    risk_score = 100  # Start with the highest score
    risk_breakdown = {}

    # Check for presence of each risk factor and reduce score accordingly
    for factor, keywords in risk_factors.items():
        for keyword in keywords:
            if keyword.lower() in tos_text.lower():
                risk_score -= 5  # Deduct points for risky clauses
                risk_breakdown[factor] = " Present "

    return risk_score, risk_breakdown

# Load pre-trained Hugging Face summarization model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Initialize SentimentIntensityAnalyzer for sentiment scoring
#nltk.download("vader_lexicon")
#sia = SentimentIntensityAnalyzer()

# Sample endpoint for summarizing and scoring TOS text
@app.route('/summarize', methods=['POST', 'OPTIONS'])
def summarize():
    if request.method == 'OPTIONS':
        # Allow preflight request
        response = jsonify({"message": "CORS preflight check passed"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response, 200

    # Handle POST request
    try:
        data = request.json
        tos_text = data.get("tosText", "")  # Ensure we are retrieving the text string
        print("Received TOS text:", tos_text)
        if not tos_text:
            return jsonify({"error": "No TOS text provided"}), 400
        def truncate_to_1024(tos_text):
            return tos_text[:1024]
        truncated_tos = truncate_to_1024(tos_text) 
        summary = summarizer(truncated_tos, max_length=130, min_length=30, do_sample=False)[0]["summary_text"]

        # Score the TOS text (e.g., sentiment analysis for risk scoring)
        #sentiment_score = sia.polarity_scores(tos_text)["compound"]
        #normalized_score = round((sentiment_score + 1) * 50)  # Convert sentiment to a 0-100 scale

        # Risk assessment based on legal clauses (GDPR, liability, data sharing, etc.)
        risk_score, risk_breakdown = classify_risk(tos_text)
        risk_summary = classify_sentiment(risk_score)
        # Respond with summary, sentiment score, and risk breakdown
        return jsonify({
            "RiskScore": risk_score,
            "RiskSummary": risk_summary,
            "RiskBreakDown": risk_breakdown,
            "Summary" : summary
             #"RiskBreakdown": risk_breakdown  # Breakdown of identified risks
        })
    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
