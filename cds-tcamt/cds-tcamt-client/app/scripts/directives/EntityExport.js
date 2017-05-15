/**
 * Created by Hossam Tamri on 4/17/17.
 */

angular.module('tcl').filter('validExportTc', function () {
    return function (items, bool) {
        if (!items || !items.length) {
            return;
        }
        if (!bool) return items;
        return items.filter(function (item) {
            return !item.valid;
        });
    };
});

angular.module('tcl').filter('exportTcSearch', function () {
    return function (items, str) {
        if (!items || !items.length) {
            return;
        }
        if (!str || str === '') return items;
        return items.filter(function (item) {
            return item.name.toLowerCase().includes(str.toLowerCase()) || item.uid.toLowerCase().includes(str.toLowerCase());
        });
    };
});


angular.module('tcl').directive('entityExport', function ($modal, FITSBackEnd, EntityService, EntityUtilsService, $http, $rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'export.html',
        scope: {
            tp: '='
        },
        controllerAs: 'ctrl',
        controller: function ($scope) {
            var ctrl = this;
            ctrl.formats = {
                NIST: 'NIST',
                CDC_SP: 'CDC_SP',
                PDF: 'PDF'
            };
            $scope.exportList = [];
            $scope.idS = [];
            this.invalid = false;
            this.preCondition = function (tc) {
                var msg = [];
                if(!tc.runnable){
                    msg.push("Test Case is Incomplete");
                }
                if(!EntityUtilsService.inSynch(tc)){
                    msg.push("Test Case is not saved");
                }
                return msg;
            };
            ctrl.configs = [
                {
                    id : ctrl.formats.NIST,
                    name : 'NIST XML Format',
                    api : 'nist',
                    valid : ctrl.preCondition
                },
                {
                    id : ctrl.formats.CDC_SP,
                    name : 'CDC CDSi Spreadsheet',
                    api : 'cdc',
                    valid : function (tc) {
                        var msg = ctrl.preCondition(tc);
                        if(tc.dateType === 'RELATIVE'){
                            msg.push("Test Case has relative dates");
                        }
                        if(tc.forecast.length > 1)
                            msg.push("Test Case has multiple forecasts");
                        var multiEval = false;
                        _.forEach(tc.events, function (ev) {
                            if(ev.evaluations.length > 1){
                                multiEval = true;
                            }
                        });
                        if(multiEval){
                            msg.push("Test Case has events with multiple evaluations");
                        }
                        console.log(msg);
                        return msg;
                    }
                },
                {
                    id : ctrl.formats.PDF,
                    name : 'PDF Document',
                    api : 'pdf'
                }

            ];
            $scope.FORMAT = ctrl.formats.NIST;
            $scope.inSynch = EntityUtilsService.inSynch;

            ctrl.configFor = function (id) {
                var conf = _.find(ctrl.configs, function (conf) {
                    return conf.id === id;
                });
                return conf;
            };

            $scope.saveTC = function (obj) {
                var unsaved = {};
                unsaved[EntityService.type.TEST_CASE] = [ obj.tc ];
                unsaved[EntityService.type.TEST_CASE_GROUP] = [];
                unsaved[EntityService.type.TEST_PLAN] = [];

                FITSBackEnd.saveAll($rootScope,unsaved, $scope.tp).then(function (result) {
                    var notification = result[0];
                    EntityUtilsService.notify(notification);
                    if(notification.severity === EntityService.severity.SUCCESS){
                        var conf = ctrl.configFor($scope.FORMAT);
                        ctrl.validateTC(conf,obj);
                        console.log("SUCC-SV");
                    }
                });
            };

            $scope.drop = function (list, item, index) {
                
                var conf = ctrl.configFor($scope.FORMAT);
                if(item._type === EntityService.type.TEST_CASE){
                    $scope.dropTC(item,conf);
                }
                else if(item._type === EntityService.type.TEST_CASE_GROUP){
                    _.forEach(item.testCases, function (tc) {
                        $scope.dropTC(tc,conf);
                    });
                }
                else if(item._type === EntityService.type.TEST_PLAN){
                    _.forEach(item.testCases, function (tc) {
                        $scope.dropTC(tc,conf);
                    });
                    _.forEach(item.testCaseGroups, function (tg) {
                        _.forEach(tg.testCases, function (tc) {
                            $scope.dropTC(tc,conf);
                        });
                    });
                }
            };

            $scope.toggleDragAndDrop = function () {
                $scope.exportList = [];
                $rootScope.blockTree = !$rootScope.blockTree;
            };

            $scope.dropTC = function (tc,conf) {
                var obj = {
                    _type : tc._type,
                    name : tc.name,
                    id : tc.id,
                    uid : tc.uid,
                    valid : conf.valid(tc).length === 0,
                    err : conf.valid(tc),
                    tc : tc
                };

                var id = _.findIndex($scope.exportList, function (tci) {
                    return tci.id === tc.id;
                });

                if(id == -1){
                    $scope.exportList.push(obj);
                    return true;
                }
                else {
                    return false;
                }
            };

            $scope.$watch('FORMAT', function () {
                ctrl.validateExportList();
            });

            ctrl.validateExportList = function () {
                var conf = ctrl.configFor($scope.FORMAT);
                _.forEach($scope.exportList,function (obj) {
                    ctrl.validateTC(conf, obj);
                });
            };

            ctrl.validateTC = function (conf,obj) {
                var ls = conf.valid(obj.tc);
                obj.valid = ls.length === 0;
                obj.err = ls;
            };

            $scope.validTCs = function () {
                return $scope.exportList.filter(function (obj) {
                    return obj.valid;
                });
            };

            $scope.delete = function (tc) {
                var id = _.findIndex($scope.exportList,function (obj) {
                    return obj.id === tc.id;
                });

                if(~id){
                    $scope.exportList.splice(id,1);
                }

                ctrl.validateExportList();
            };

            $scope.clear = function () {
                $scope.exportList = [];
            };

            $rootScope.$watch('blockTree',function () {
               if(!$rootScope.blockTree)
                   $scope.clear();
            });

            $scope.export = function () {
                var conf = ctrl.configFor($scope.FORMAT);
                var form = document.createElement("form");

                form.action = $rootScope.api('api/testcase/'+$scope.encodeURL()+'/export/'+conf.api);
                form.method = "POST";
                form.target = "_target";
                form.style.display = 'none';
                document.body.appendChild(form);
                form.submit();
            };

            $scope.encodeURL = function () {
                var list = $scope.validTCs();
                var str = "";
                _.forEach(list,function (elm) {
                   str += elm.id+",";
                });

                return str.substring(0,str.length - 1);
            };
        }
    }
});
