(function (window, $) {

   //global variables
   var host = "https://inpho.cogs.indiana.edu";

   var crossRef = angular.module("crossRef", []);
   crossRef.controller("crossRefCtrl", function ($scope, $http, $q, $timeout) {

      $scope.sep_dir = "kant";
      $scope.entity = {};

      $scope.entities = [];
      $scope.labels = [];
      $timeout(function () { getEntities($scope, $http, $q) }, 50);

      $scope.thinkerColumns = [];
      $scope.ideaColumns = [];

      $scope.getCurrentEntity = function () {
         getEntityService($scope, $http, $q);
      };

      $scope.getThisEntity = function (sep_dir) {
         $scope.sep_dir = sep_dir;
         $scope.getCurrentEntity();
      };

      $scope.showThinkerCol = function (col) { //determine if a thinker column should show or not.                  
         return col <= $scope.thinkerColumns.length;
      };

      $scope.showIdeaCol = function (col) { //determine if a thinker column should show or not.                  
         return col <= $scope.ideaColumns.length;
      };

      setTimeout($scope.getCurrentEntity(), 50);
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
                        scope.sep_dir = scope.entities[i].sep_dir;
                        scope.getCurrentEntity();
                        break;
                     }
                  }
               }, 0);
            }
         });
      };
   });

   function getEntityService(scope, http, $q) {

      http({ method: 'GET', url: host + "/entity.json?sep=" + scope.sep_dir }).
               success(function (data, status, headers, config) {
                  scope.entity = data.responseData.results[0];
                  getCrossRefs(scope, http, $q);
               }).
               error(function (data, status, headers, config) {
                  alert("Error:" + status);
               });
   }

   function BuildUriForReference(type, id, column) {
      //   /thinker/$id/occurrences.json?sep_filter=True
      //   /idea/$id/hyponyms.json?sep_filter=True
      return "/" + type + "/" + id + "/" + column + ".json?sep_filter=True";
   }

   //Each call pushs the data into results so that all can be processed later. We will also use the index to indicate which column the 
   // data is for because we don't know the order of the returns.
   function getCrossRefAsyn(http, uri, $q, results, index) {

      var defer = $q.defer();

      http({ method: 'GET', url: host + uri }).
          success(function (data, status, headers, config) {
             results.push({ "index": index, "data": data.responseData.results });
             defer.resolve();
          }).
          error(function (data, status, headers, config) {
             defer.reject();
          });

      return defer.promise;
   }

   function getCrossRefs(scope, http, $q) {

      var type = scope.entity.type;
      var id = scope.entity.ID;
      scope.thinkers = [];
      scope.ideas = [];

      if (type === "thinker") { //the column headings are used to contruct ulr based on the type and id.
         //For thinker-idea
         //   /thinker/$id/idea_occurrences.json?sep_filter=True
         //   /thinker/$id/related_ideas.json?sep_filter=True
         scope.ideaColumns = ["idea_occurrences", "related_ideas"];

         //For thinker
         //   /thinker/$id/occurrences.json?sep_filter=True
         //   /thinker/$id/related.json?sep_filter=True
         //   /thinker/$id/hyponyms.json?sep_filter=True
         //   /thinker/$id/influenced.json?sep_filter=True
         scope.thinkerColumns= ["occurrences", "related", "hyponyms"];//, "influenced"];
      }
      else if (type === "idea") {
         //For idea
         //   /idea/$id/occurrences.json?sep_filter=True
         //   /idea/$id/related.json?sep_filter=True
         //   /idea/$id/hyponyms.json?sep_filter=True
         //   /idea/$id/evaluated.json?sep_filter=True
         //   /idea/$id/first_order.json?sep_filter=True
         scope.ideaColumns = ["occurrences", "related", "hyponyms", "evaluated", "first_order"];

         //For idea-thinker
         //   /idea/$id/thinker_occurrences.json?sep_filter=True
         //   /idea/$id/related_thinkers.json?sep_filter=True
         scope.thinkerColumns = ["thinker_occurrences", "related_thinkers"];
      }
      else {
         alert("entity type " + type + " is not supported");
         return;
      }

      populateOneReferenceType(http, $q, scope.thinkers, scope.thinkerColumns, type, id);
      populateOneReferenceType(http, $q, scope.ideas, scope.ideaColumns, type, id);
   }

   function populateOneReferenceType(http, $q, references, columns, type, id) {

      var results = [];
      var promises = [];

      for (var i = 0 ; i < columns.length; i++) { //can I reply on the single thread of javascript to do a loop here?
         var column = columns[i];
         promises.push(getCrossRefAsyn(http, BuildUriForReference(type, id, column), $q, results, i));
      }

      $q.all(promises).then(function () {
         populateCrossRef(references, results, columns.length);
      });
   }

   //crossRefs: could be thinkers or ideas, results: the array from cross ref calls.
   function populateCrossRef(references, results, numOfColumns) {

      for (var i = 0; i < results.length; i++) {
         populateCrossRefForOneColumn(references, results[i].index, results[i].data);
      }

      calculateOverallRanking(references, numOfColumns);

      sortOverallRanking(references);
   }

   //Because the column names for idea and thinker could be different, depending the type, here we use col0, col1 etc
   //to represent the ranking column name.  This allows us to generically process the different column and types.
   function populateCrossRefForOneColumn(referencs, colIndex, data) {

      var colName = "col" + colIndex;
      
      for (var i = 0; i < data.length; i++) {

         var ref = data[i];

         var existingReferece = findReferenceByLabel(ref.label, referencs);

         if (existingReferece != null) {
            existingReferece[colName] = i + 1;
         }
         else {
            ref[colName] = i + 1;
            referencs.push(ref);
         }
      }
   }

   //referencs could be ideas or thinkers
   function findReferenceByLabel(label, references) {

      var ret = null;

      for (var i = 0; i < references.length; i++) {
         if (label === references[i].label) {//the label of the refrence already exists in the array.
            ret = references[i];
            break;
         }
      }

      return ret;
   }

   function calculateOverallRanking(references, numOfColumns) {

      for (var i = 0; i < references.length; i++) {//add all rankings together for a thinker

         var ref = references[i];
         var overallRanking = 0;
         var numOfSources = 0;

         for (var j = 0; j < numOfColumns; j++) {
            var ranking = ref["col" + j];
            if (!isNaN(ranking)) {
               overallRanking += ranking;
               numOfSources++;
            }
         }

         ref.overallRanking = overallRanking;
         ref.numOfSources = numOfSources;
      }
   }

   function sortOverallRanking(references) {
      references.sort(function (a, b) {

         if (a.numOfSources != b.numOfSources)
            return b.numOfSources - a.numOfSources; //descending for number of sources
         else
            return a.overallRanking - b.overallRanking; //ascending for the ranking.
      });
   }

})(window, jQuery);
