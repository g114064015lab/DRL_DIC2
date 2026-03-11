from flask import Flask, render_template, request, jsonify
from rl_solver import evaluate_policy

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    data = request.json
    n = data.get('n')
    start_id = data.get('start_id')
    end_id = data.get('end_id')
    obstacle_ids = data.get('obstacle_ids', [])
    
    if not all([n, start_id, end_id]):
        return jsonify({"error": "Missing required grid parameters"}), 400
        
    result = evaluate_policy(n, start_id, end_id, obstacle_ids)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
