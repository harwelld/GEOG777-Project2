from json import load
from os import path

from flask import current_app as app
from flask import request, render_template


@app.route('/')
def default():
	return render_template('map.html')
