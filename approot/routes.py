from flask import current_app as app
from flask import redirect, render_template, url_for


@app.route('/')
def default():
	return redirect(url_for('home'))

@app.route('/pdx-crime-map')
def home():
	return render_template('map.html')
