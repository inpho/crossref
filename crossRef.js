(function (window, $) {
    /*
      $occurrences = inpho("/thinker/$id/occurrences.json?sep_filter=True");
      $related = inpho("/thinker/$id/related.json?sep_filter=True");
      $hyponyms = inpho("/thinker/$id/hyponyms.json?sep_filter=True");
      $influenced = inpho("/thinker/$id/influenced.json?sep_filter=True");
    */

    //global variables
    var host = "https://inpho.cogs.indiana.edu";

    var crossRef = angular.module("crossRef", []);
    crossRef.controller("crossRefCtrl", function ($scope, $http, $q, $timeout) {

	$scope.currentThinkerID = "3345";
	$scope.newThinkerID = "";

	$scope.currentThinker = {}; //initialize to an empty array.

	$scope.currentIdeaID = ""; 
	$scope.newIdeaID = "";

	$scope.currentIdea = {}; 

	$scope.getCurrentIdea = function() {
	    getIdeaService($scope, $http, $q); 
	};
	
	$scope.getThisIdea = function(ideaID) {
	    $scope.currentIdeaID = ideaID; 
	    console.log(ideaID); 
	    $scope.getCurrentIdea(); 
	};

	$scope.getCurrentThinker = function () {
            getThinkerService($scope, $http, $q);
	};

	$scope.getThisThinker = function (thinkerID) {
            $scope.currentThinkerID = thinkerID;
            $scope.getCurrentThinker();
	};

	$scope.getNewThinker = function () {
            $scope.getThisThinker($scope.newThinkerID);
	};

	$scope.entities = [];
	$scope.labels = [];
	setTimeout($scope.getCurrentThinker(), 50);
	$timeout(function () { getEntities($scope, $http, $q) }, 50);
    });

    function getEntities(scope, http, $q) {

	var defer = $q.defer();

	http({ method: 'GET', url: host + "//entity.json?sep_filter=True" }).
            success(function (data, status, headers, config) {
		defer.resolve(data.responseData.results);
            }).
            error(function (data, status, headers, config) {
		defer.reject();
            });

	defer.promise.then(function (results) {
            scope.entities = results;
            for (var i = 0; i < scope.entities.length; i++) {
		var entity = scope.entities[i];
		scope.labels.push(entity.label);		
            }
	});
    }

    
    function getIdeaService(scope, http, $q) { //retrieve one thinker at a time using http service provided by AngularJS.  Recommend to stick with AngularJS

	http({ method: 'GET', url: host + "/idea/" + scope.currentIdeaID + ".json" }).
	    success(function (data, status, headers, config) {
		console.log(data); 
		scope.currentIdea = data;
		scope.currentIdea.thinkerCrossRef = [];
		//getCrossRefs(scope, http, $q);
	    }).
	    error(function (data, status, headers, config) {
		alert("Error:" + status);
	    });
    }
    
    function getThinkerService(scope, http, $q) { //retrieve one thinker at a time using http service provided by AngularJS.  Recommend to stick with AngularJS

	http({ method: 'GET', url: host + "/thinker/" + scope.currentThinkerID + ".json" }).
            success(function (data, status, headers, config) {
		scope.currentThinker = data;
		scope.currentThinker.thinkerCrossRef = [];
		getCrossRefs(scope, http, $q);
            }).
            error(function (data, status, headers, config) {
		alert("Error:" + status);
            });
    }
    
    function getIdeaCrossRefs(scope, http, $q){
	
	var occurrences = getIdeaRefAsyn(scope.currentIdeaID, http, "/idea/$id/thinker_occurrences.json?sep_filter=True", $q);
	occurrences.then(function (results) { 
	    
	    var relatedterms = getideaRefAsyn(scope.currentIdeaID, http, "/idea/$id/related_thinkers.json?sep_filter=True", $q);
	    relatedterms.then(function (results){
            });
	});
    }

    function getCrossRefs(scope, http, $q) {

	var occurrences = getCrossRefAsyn(scope.currentThinkerID, http, "/occurrences.json?sep_filter=True", $q);
	occurrences.then(function (results) {

	    populateCrossRef(scope.currentThinker.thinkerCrossRef, "occurrencesRanking", results);

	    var related = getCrossRefAsyn(scope.currentThinkerID, http, "/related.json?sep_filter=True", $q);
	    related.then(function (results) {

		populateCrossRef(scope.currentThinker.thinkerCrossRef, "relatedRanking", results);

		var hyponyms = getCrossRefAsyn(scope.currentThinkerID, http, "/hyponyms.json?sep_filter=True", $q);
		hyponyms.then(function (results) {

		    populateCrossRef(scope.currentThinker.thinkerCrossRef, "hyponymsRanking", results);
		    calculateOverallRanking(scope.currentThinker.thinkerCrossRef);
		    sortOverallRanking(scope.currentThinker.thinkerCrossRef);
		    //var influenced = getCrossRefAsyn(scope, http, "/influenced.json?sep_filter=True", $q); //this api returns server error.
		    /*
		      influenced.then(function (results) {
		      alert("didn't get to here");
		      populateCrossRef(scope, "influencedRanking", results);
		      });
		    */
		});
	    });
	});
    }

    var rankingTypes = ["occurrencesRanking", "relatedRanking", "hyponymsRanking", "influencedRanking"];

    function calculateOverallRanking(thinkers) {

	for (var i = 0; i < thinkers.length; i++) {//add all rankings together for a thinker
	    var thinker = thinkers[i];
	    var overallRanking = 0;
	    var numOfSources = 0;
	    for (var j = 0; j < rankingTypes.length; j++) {
		var ranking = thinker[rankingTypes[j]];
		if (!isNaN(ranking)) {
		    overallRanking += ranking;
		    numOfSources++;
		}
	    }

	    thinker.overallRanking = overallRanking;
	    thinker.numOfSources = numOfSources;
	}
    }



    function sortOverallRanking(thinkers) {
	thinkers.sort(function (a, b) {

	    if (a.numOfSources != b.numOfSources)
		return b.numOfSources - a.numOfSources; //descending for number of sources
	    else 
		return a.overallRanking - b.overallRanking; //ascending for the ranking.
	});
    }

    function getCrossRefAsyn(thinkerID, http, uri, $q) {

	var defer = $q.defer();

	http({ method: 'GET', url: host + "/thinker/" + thinkerID + uri }).
	    success(function (data, status, headers, config) {
		defer.resolve(data.responseData.results);
	    }).
	    error(function (data, status, headers, config) {
		defer.reject();
	    });

	return defer.promise;
    }

    function getIdeaRefAsyn(ideaID, http, uri, $q) {

	var defer = $q.defer();

	http({ method: 'GET', url: host + "/idea/" + ideaID + uri }).
	    success(function (data, status, headers, config) {
		defer.resolve(data.responseData.results);
	    }).
	    error(function (data, status, headers, config) {
		defer.reject();
	    });

	return defer.promise;
    }


    function populateCrossRef(thinkers, rankingType, results) {

	for (var i = 0; i < results.length; i++) {
	    var thinker = results[i];

	    var existingThinker = findThinkerByLabel(thinker.label, thinkers);

	    if (existingThinker != null) {
		existingThinker[rankingType] = i + 1;
	    }
	    else {
		thinker[rankingType] = i + 1;
		thinkers.push(thinker);
	    }
	}
    }

    function findThinkerByLabel(thinkerLabel, thinkers) {

	var ret = null;
	3
	for (var i = 0; i < thinkers.length; i++) {
	    if (thinkerLabel === thinkers[i].label) {//the thinker already exists in the array.
		ret = thinkers[i];
		break;
	    }
	}

	return ret;
    }

    crossRef.directive('autoComplete', function ($timeout) {
	return function (scope, iElement, iAttrs) {
	    iElement.autocomplete({
		source: scope[iAttrs.uiItems],
		select: function () {
		    $timeout(function () {
			iElement.trigger('input');
			var value = iElement.val();
			for (var i = 0; i < scope.entities.length; i++) {
			    var entity = scope.entities[i];
			    if (entity.label === value) {
				if (entity.type === "thinker"){
			        	scope.currentThinkerID = entity.ID;
				   scope.getCurrentThinker();
                                }
				else {//
//do stuff for ideas
alert("idea");
}
				  break;
			    }
			}
		    }, 0);
		}
	    });
	};
    });
})(window, jQuery);
