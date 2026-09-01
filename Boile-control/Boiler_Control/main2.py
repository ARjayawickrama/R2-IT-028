from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app) 


model = joblib.load('SUPER_FISH_COOKING_ENSEMBLE_MODEL.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    fish_weight = data.get('fish_weight')
    thickness = data.get('thickness')
    temperature = data.get('temperature')
    

    input_data = [[fish_weight, thickness, temperature]]
    prediction = model.predict(input_data)
    
    return jsonify({
        'predicted_cooking_time': round(float(prediction[0]))
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)