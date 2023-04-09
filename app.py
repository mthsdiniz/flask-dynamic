from flask import Flask, render_template, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
import os
import requests
from urllib.parse import quote
import re
import os
import io
import json

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///maps.db"
db = SQLAlchemy(app)


class Map(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    vector_layers = db.Column(db.String, nullable=True)
    tiff_layers = db.Column(db.String, nullable=True)
    zoom_level = db.Column(db.Integer, nullable=True)
    center_lat = db.Column(db.Float, nullable=True)
    center_lng = db.Column(db.Float, nullable=True)


def create_tables():
    with app.app_context():
        #db.drop_all()
        db.create_all()


@app.route("/")
def index():
    maps = Map.query.all()
    return render_template("index.html", maps=maps)


@app.route("/save_map", methods=["POST"])
def save_map():
    name = request.form["name"]
    vector_layers = request.form["vector_layers"]
    tiff_layers = request.form["tiff_layers"]
    zoom_level = request.form["zoom_level"]
    center_lat = request.form["center_lat"]
    center_lng = request.form["center_lng"]
    print(center_lat,center_lng)
    map = Map(
        name=name,
        vector_layers=vector_layers,
        tiff_layers=tiff_layers,
        zoom_level=zoom_level,
        center_lat=center_lat,
        center_lng=center_lng,
    )
    db.session.add(map)
    db.session.commit()
    return jsonify({"status": "success"})


@app.route("/load_map", methods=["GET"])
def load_map():
    map_id = request.args.get("map_id")
    map = Map.query.get(map_id)
    return jsonify(
        {
            "name": map.name,
            "vector_layers": map.vector_layers,
            "tiff_layers": map.tiff_layers,
            "zoom_level": map.zoom_level,
            "center_lat": map.center_lat,
            "center_lng": map.center_lng,
        }
    )

@app.route('/fetch_geotiff', methods=['POST'])
def fetch_geotiff():
    proxy = 'http://web.prod.proxy.cargill.com:4200'
    os.environ['http_proxy'] = proxy
    os.environ['HTTP_PROXY'] = proxy
    os.environ['https_proxy'] = proxy
    os.environ['HTTPS_PROXY'] = proxy
    os.environ['REQUESTS_CA_BUNDLE'] = r'./static/cacert.pem'

    data = request.get_json()
    url = data.get('url')

    headers = {'apikey': '84918062-eb81-4f79-8f8e-3f28a3551402'}

    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:

        return send_file(io.BytesIO(response.content), mimetype='image/tiff')
    else:
        return url, accessToken
        #return response.content, response.status_code



if __name__ == "__main__":
    create_tables()
    # app.run(use_reloader=False,debug=True)
    app.run(debug=True)
