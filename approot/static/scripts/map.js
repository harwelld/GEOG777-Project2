// Dylan Harwell - GEOG 777 - Fall 2021 - Project 2
// ESRI JS API v4.21

require([
	"esri/config",
	"esri/WebMap",
	"esri/geometry/Point",
	"esri/views/MapView",
	"esri/widgets/Editor",
	"esri/widgets/Expand",
	"esri/widgets/LayerList",
	"esri/widgets/Track"
	], (
	esriConfig,
	WebMap,
	Point,
	MapView,
	Editor,
	Expand,
	LayerList,
	Track
	) => {

	esriConfig.apiKey = "AAPK3283bf26b755450ca3515b519c331123PasmpRKadVRG74CtjghVWetfSZNRP0GE8KPdHR_1bAJaTwaLZ6ti75TfwFUBJJPO";

	// Define global variables
	let editConfigCitizenCrimeLayer;
	let currentNeighborhood;
	let neighborhoods;
	let ppbCrimes2018;
	let ppbCrimes2019;
	let ppbCrimes2020;
	let chart;
	let chartData = {
		Person: 0,
		Property: 0,
		Society: 0
	};

	// Create Map and View Objects
	const map = new WebMap({
		portalItem: { id: "875628c8c9db49df93463e8ec6b94961" }
	});
	const view = new MapView({
		map: map,
		center: [-122.679, 45.518],
		zoom: 14,
		container: "map",
		popup: {
			dockEnabled: true,
			dockOptions: {
				buttonEnabled: true,
				position: "bottom-left"
			}
		}
	});

	// Do Stuff When View is Ready
	view.when(() => {

		// Loop Through Map and Define Layers
		view.map.layers.forEach((layer) => {
			if (layer.title == "Citizen-Reported Crimes") {
				editConfigCitizenCrimeLayer = {
					layer: layer, 
					fieldConfig: [
						{ name: "Address" },
						{ name: "Date" },
						{ name: "CrimeAgainst" },
						//{ name: "OffenseCategory" }, No support for subtypes or contingent values in hosted feature layers!
						{ name: "Description" },       // Using Description field instead
						{ name: "ReportedBy" },
						{ name: "ReportedTo" }
					]
				};
			} else if (layer.title == "PPB Yearly Crimes") {
				layer.layers.forEach((subLayer) => {
					if (subLayer.title == "2020") {
						ppbCrimes2020 = subLayer
					} else if (subLayer.title == "2019") {
						ppbCrimes2019 = subLayer
					} else if (subLayer.title == "2018") {
						ppbCrimes2018 = subLayer
					}
				});
			} else if (layer.title == "Neighborhoods") {
				neighborhoods = layer;
			}
		});

		// Add Track Widget
		let track = new Track({
			view: view,
			goToLocationEnabled: true
		});

		// Start Tracking and Get User Location and Neighborhood
		track.start();
		track.on("track", (event) => {
			const { latitude, longitude } = event.position.coords;
			const userLocation = view.toScreen(new Point({ latitude, longitude }));
			const point = view.toMap(userLocation);
			neighborhoods.queryFeatures({
				geometry: point,
				spatialRelationship: "intersects",
				returnGeometry: true,
				outFields: ["*"]
			}).then((results) => {
				currentNeighborhood = results.features[0];
				console.log(`User is in neighborhood: ${currentNeighborhood.attributes.Name}`);
				// Subscribe to Crimes 2020 LayerView for Client-Side Querying
				view.whenLayerView(ppbCrimes2020).then((layerView) => {
					layerView.watch("updating", (value) => {
						if (!value) {
							queryCrimes(layerView, currentNeighborhood);
						}
					});
				});
			}).catch((error) => {
				console.log(error);
			});
		});

		// Build Expandable Layer List Widget
		const layerList = new LayerList({
			view: view,
			listItemCreatedFunction: (event) => {
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
			label: "Layer List",
			view: view,
			expandIconClass: "esri-icon-layers",
			expandTooltip: "View map layers",
			content: layerList
		});

		// Build Expandable Editor Widget
		const editor = new Editor({
			view: view,
			label: "Report a Crime", //DOESNT WORK
			layerInfos: [editConfigCitizenCrimeLayer],
			snappingOptions: { enabled: false }
		});
		
		// Build Expandable Crime Starts Chart
		let editorExpand = new Expand({
			view: view,
			label: "Report a Crime", //DOESNT WORK
			expandIconClass: "esri-icon-edit",
			expandTooltip: "Report a crime",
			content: editor
		});
		
		// Attempt to change Editor widget label: FAIL
		// editor.when(() => {
		// 	console.log('Initialized');
		// 	document.getElementsByClassName('esri-editor__title')[0].innerText = "Report a Crime";
		// });

		// Build Expandable Chart Widget
		let chartExpand = new Expand({
			view: view,
			expanded: true,
			expandIconClass: "esri-icon-chart",
			expandTooltip: "Show 2020 neighborhood crime stats",
			content: document.getElementById("chartPanel")
		});

		// Add widgets to UI
		view.ui.add(track, "top-left");
		view.ui.add(layerListExpand, "top-left");
		view.ui.add(editorExpand, "top-right");
		view.ui.add(chartExpand, "bottom-left");
	});

	function queryCrimes(layerView, neighborhood) {
		layerView.queryFeatures({
			geometry: neighborhood.geometry,
			//geometry: view.extent,   // Uncomment for testing - pan screen to update data
			spatialRelationship: "intersects",
			returnGeometry: false,
			outFields: ["*"]
		}).then((results) => {
			console.log(`Total 2020 Neighborhood Crimes: ${results.features.length}`);
			updateChartData(results.features);
			updateChart();
		}).catch((error) => {
			console.log(error);
		});
	}

	function updateChartData(features) {
		let person = 0;
		let property = 0;
		let society = 0;
		features.forEach((feature) => {
			if (feature.attributes.CrimeAgainst == "Person") {
				person++;
			} else if (feature.attributes.CrimeAgainst == "Property") {
				property++;
			} else if (feature.attributes.CrimeAgainst == "Society") {
				society++;
			}
		});
		chartData.Person = person;
		chartData.Property = property;
		chartData.Society = society;
		console.log(chartData);
	}

	function updateChart() {
		if (!chart) {
			chart = new Chart(document.getElementById("chart"), {
				type: "bar",
				data: {
					labels: ["Person", "Property", "Society"],
					datasets: [
						{
							label: "Number of Crimes",
							backgroundColor: ["#FF6600", "#FFFF00", "#FFCC00"],
							data: [chartData.Person, chartData.Property, chartData.Society]
						}
					]
				},
				options: {
					responsive: false,
					legend: { display: false },
					title: {
						display: true,
						text: `2020 Neighborhood Crime Statisics: ${currentNeighborhood.attributes.Name}`
					}
				}
			});
		} else {
			chart.data.datasets[0].data[0] = chartData.Person;
			chart.data.datasets[0].data[1] = chartData.Property;
			chart.data.datasets[0].data[2] = chartData.Society;
			chart.update();
		}
	}

});
