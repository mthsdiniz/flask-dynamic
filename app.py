from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///maps.db'
db = SQLAlchemy(app)

class Map(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    vector_layers = db.Column(db.String, nullable=True)
    raster_layers = db.Column(db.String, nullable=True)
    tiff_layers = db.Column(db.String, nullable=True)

def create_tables():
    with app.app_context():
        #db.drop_all()
        db.create_all()

@app.route('/')
def index():
    maps = Map.query.all()
    return render_template('index.html', maps=maps)

@app.route('/save_map', methods=['POST'])
def save_map():
    name = request.form['name']
    layers = request.form['layers']
    map = Map(name=name, layers=layers)
    db.session.add(map)
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/load_map', methods=['GET'])
def load_map():
    map_id = request.args.get('map_id')
    map = Map.query.get(map_id)
    return jsonify({'name': map.name, 'layers': map.layers})

if __name__ == '__main__':
    create_tables()
    app.run(use_reloader=False,debug=True)
