// Dylan Harwell - GEOG 777 - Fall 2021 - Project 2

require([
	"esri/config",
	"esri/WebMap",
	"esri/geometry/Point",
	"esri/views/MapView",
	"esri/layers/FeatureLayer",
	"esri/widgets/Editor",
	"esri/widgets/Expand",
	"esri/widgets/LayerList",
	"esri/widgets/Locate"
	], function(
		esriConfig,
		WebMap,
		Point,
		MapView,
		FeatureLayer,
		Editor,
		Expand,
		LayerList,
		Locate
	) {

	esriConfig.apiKey = "AAPK3283bf26b755450ca3515b519c331123PasmpRKadVRG74CtjghVWetfSZNRP0GE8KPdHR_1bAJaTwaLZ6ti75TfwFUBJJPO";

	let editConfigCitizenCrimeLayer;

	const map = new WebMap({
		portalItem: {
			id: "875628c8c9db49df93463e8ec6b94961"
		}
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

	// var bikeRoutes = new MapImageLayer({
	// 	url: "https://www.portlandmaps.com/arcgis/rest/services/Public/PBOT_RecommendedBicycleRoutes/MapServer"
	// });
	// map.add(bikeRoutes);

	// var crimes2018 = new FeatureLayer({
	// 	url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/ArcGIS/rest/services/PPB_Crimes/FeatureServer/2"
	// });
	// map.add(crimes2018);

	// var crimes2019 = new FeatureLayer({
	// 	url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/ArcGIS/rest/services/PPB_Crimes/FeatureServer/1"
	// });
	// map.add(crimes2019);

	// var crimes2020 = new FeatureLayer({
	// 	url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/ArcGIS/rest/services/PPB_Crimes/FeatureServer/0"
	// });
	// map.add(crimes2020);

	view.when(function(){
		let locate = new Locate({
			view: view,
			useHeadingEnabled: true,
			goToLocationEnabled: true
		});
		locate.locate();

		locate.on("locate", function(event) {
			const { latitude, longitude } = event.position.coords;
			const screenPoint = view.toScreen(new Point({ latitude, longitude }));
			let currentNeighborhood = queryNeighborhoods(screenPoint);

		});

		const layerList = new LayerList({
			view: view,
			listItemCreatedFunction: function(event) {
				const item = event.item;
				if (item.layer.type != "group") {
					item.panel = {
						content: "legend",
						open: true
					};
				}
			}
		});

		let layerListExpand = new Expand({
			view: view,
			expandIconClass: "esri-icon-layers",
			content: layerList
		});
		view.ui.add(layerListExpand, "top-right");

		view.map.layers.forEach(function(layer) {
			if (layer.title == "Citizen-Reported Crimes") {
				editConfigCitizenCrimeLayer = {
					layer: layer, 
					fieldConfig: [
						{ name: "Address" },
						{ name: "Date" },
						{ name: "CrimeAgainst" },
						{ name: "OffenseCategory" },
						{ name: "ReportedBy" },
						{ name: "ReportedTo" }
					]
				};
			}
		});

		const editor = new Editor({
			//label: "Citizen Crime Reporter",  //DOESNT WORK
			view: view,
			layerInfos: [editConfigCitizenCrimeLayer],
			snappingOptions: { enabled: false }
		});

		let editorExpand = new Expand({
			view: view,
			expandIconClass: "esri-icon-edit",
			content: editor
		});
		view.ui.add(editorExpand, "top-right");
	});

	function queryNeighborhoods(screenPoint) {
		const point = view.toMap(screenPoint);
		neighborhoods.queryFeatures({
			geometry: point,
			spatialRelationship: "intersects",
			returnGeometry: true,
			outFields: ["*"]
		}).then(function(results) {
			console.log(results.features[0].geometry);
			return results.features[0].geometry;
		}).catch(function(error) {
			console.log(error);
		});
	}

	function queryCrimes(currentNeighborhood) {
		
	}
});

