from flask import Flask, request, jsonify
 # Replace with your summarization/scoring library

app = Flask(__name__)

# Sample endpoint for summarizing and scoring TOS text
@app.route('/summarize', methods=['POST'])
def summarize():
    try:
        data = request.json
        tos_text = data.get("tosText", "")
        print("Received TOS text:", tos_text)
        if not tos_text:
            return jsonify({"error": "No TOS text provided"}), 400

        # Replace with your ML model or logic
        summary = "This is a sample summary for testing purposes."  # Summarize the TOS text
        score =  75  # Score the TOS text (e.g., based on readability or clauses)

        return jsonify({
            "summary": summary,
            "score": score
        })
    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
