// Dylan Harwell - GEOG 777 - Fall 2021 - Project 2

require([
	"esri/config",
	"esri/Map",
	"esri/views/MapView",
	"esri/layers/FeatureLayer",
	"esri/widgets/Expand",
	"esri/widgets/LayerList",
	"esri/widgets/Legend",
	"esri/widgets/Locate"
	], function(
		esriConfig,
		Map,
		MapView,
		FeatureLayer,
		Expand,
		LayerList,
		Legend,
		Locate
	) {

	esriConfig.apiKey = "AAPK3283bf26b755450ca3515b519c331123PasmpRKadVRG74CtjghVWetfSZNRP0GE8KPdHR_1bAJaTwaLZ6ti75TfwFUBJJPO";

	const map = new Map({
		basemap: "arcgis-navigation"
	});

	const view = new MapView({
		map: map,
		center: [-122.679, 45.518],
		zoom: 14,
		container: "map"
	});

	var neighborhoods = new FeatureLayer({
		url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/ArcGIS/rest/services/Neighborhoods/FeatureServer/0"
	});
	map.add(neighborhoods);

	view.when(function(){
		let locate = new Locate({
			view: view,
			useHeadingEnabled: true,
			goToLocationEnabled: true
		});
		//view.ui.add(locate, "top-left");
		locate.locate();

		let legend = new Legend({
			view: view,
			layerInfos: [{
				layer: neighborhoods,
				title: "Neighborhoods"
			}]
		});

		let legendExpand = new Expand({
			view: view,
			expandIconClass: "esri-icon-legend",
			content: legend
		});
		view.ui.add(legendExpand, "top-right");
	});

});
