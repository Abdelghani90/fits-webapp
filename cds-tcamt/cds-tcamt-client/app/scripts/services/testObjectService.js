angular.module('tcl').factory('TestObjectUtil', function () {
    var testObjectService = {
        hash: function (list) {
            for (var i in list) {
                testObjectService.updateHash(list[i]);
            }
        },
        updateEventId : function (evList,oId,nId) {
            console.log("UPDATE EV ID");
          for(var i = 0; i < evList.length; i++){
              if(evList[i].hasOwnProperty("vaccination")){
                  var vEvent = evList[i].vaccination;
                  if(vEvent.position+'' === oId+''){
                      vEvent.position = nId;
                  }
                  if(vEvent.date && vEvent.date.type === 'relative'){
                      this.updateRulesVId(vEvent.date.rules,oId,nId);
                  }
              }
          }
        },
        updateRulesVId : function (rulesList,oId,nId) {
            for(var i = 0; i < rulesList.length; i++){
                if(rulesList[i].hasOwnProperty("relativeTo") && rulesList[i].relativeTo.hasOwnProperty("reference") && rulesList[i].relativeTo.reference === 'dynamic'){
                    var relation = rulesList[i].relativeTo;
                    if(relation.id+'' === oId+''){
                        relation.id = nId;
                    }
                }
            }
        },
        hashChanged: function (tc) {
            var _tc = testObjectService.prepare(tc);
            delete _tc.metaData.dateLastUpdated;
            return md5(JSON.stringify(JSON.parse(angular.toJson(_tc)), Object.keys(_tc).sort())) !== tc._hash;
        },
        updateHash: function (tc) {
            var _tc = testObjectService.prepare(tc);
            delete _tc.metaData.dateLastUpdated;
            tc._hash = md5(JSON.stringify(JSON.parse(angular.toJson(_tc)), Object.keys(_tc).sort()));
        },
        cleanObject: function (obj, exp) {
            if (typeof obj === 'object') {
                if (!Array.isArray(obj)) {
                    for (var prop in obj) {
                        if (exp.test(prop)) {
                            delete obj[prop];
                        }
                        else {
                            testObjectService.cleanObject(obj[prop], exp);
                        }
                    }
                }
                else {
                    for (var i in obj) {
                        testObjectService.cleanObject(obj[i], exp);
                    }
                }
            }
        },

        sanitizeDate: function (obj) {
            if (obj) {
                if (obj.hasOwnProperty("type")) {
                    if (obj.type === 'fixed') {
                        obj._dateObj = new Date(obj.date);
                    }
                }
            }
        },

        sanitizeDates: function (obj) {
            if (typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    for (var i in obj) {
                        testObjectService.sanitizeDates(obj[i]);
                    }
                }
                else {
                    for (var x in obj) {
                        if (~x.search(/date/i) || ~x.search(/earliest/i) || ~x.search(/recommended/i) || ~x.search(/dob/i) || ~x.search(/pastDue/i)) {
                            if (typeof obj[x] === 'number') {
                                obj["_" + x] = new Date(obj[x]);
                            }
                            else {
                                testObjectService.sanitizeDate(obj[x]);
                            }
                        }
                        else {
                            testObjectService.sanitizeDates(obj[x]);
                        }
                    }
                }
            }
        },

        sanitizeEvents: function (tc) {
            if (tc.events) {
                for (var e = 0; e < tc.events.length; e++) {
                    tc.events[e]._type = "vaccination";
                    tc.events[e].vaccination.id = e;
                }
            }
        },

        cleanDates: function (obj) {
            if (typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    for (var i in obj) {
                        testObjectService.cleanDates(obj[i]);
                    }
                }
                else {
                    for (var x in obj) {
                        if (~x.search(/date/i) || ~x.search(/earliest/i) || ~x.search(/recommended/i) || ~x.search(/dob/i) || ~x.search(/pastDue/i)) {
                            testObjectService.cleanDate(obj[x]);
                        }
                        else {
                            testObjectService.cleanDates(obj[x]);
                        }
                    }
                }
            }
        },

        cleanDate: function (obj) {
            if (obj) {
                if (obj.hasOwnProperty("type")) {
                    if (obj.type === "fixed") {
                        delete obj._dateObj;
                    }
                }
            }
        },

        getList: function (tp, id) {
            var tcg = this.getTCGroup(tp, id);
            if (tcg) {
                return tcg.testCases;
            }
            else {
                var indexOfObj = testObjectService.index(tp.testCases, "id", id);
                if (~indexOfObj) {
                    return tp.testCases;
                }
            }
            return null;
        },

        getTCGroup: function (tp, id) {
            var indexOfObj;
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                indexOfObj = testObjectService.index(tp.testCaseGroups[tcg].testCases, "id", id);
                if (~indexOfObj) {
                    return tp.testCaseGroups[tcg];
                }
            }
            return null;
        },

        getGroupByID: function (tp, id) {
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                if (tp.testCaseGroups[tcg].id === id) {
                    return tp.testCaseGroups[tcg];
                }
            }
            return null;
        },

        clone: function (obj) {
            var c = JSON.parse(angular.toJson(obj));
            testObjectService.cleanObject(c, new RegExp("^id$"));
            return c;
        },

        cloneEntity: function (entity) {
            var e = testObjectService.clone(entity);
            testObjectService.markWithCLID(e);
            return e;
        },

        synchronize: function (id, container, remoteObj) {
            var indexOfObj = testObjectService.index(container, "id", id);
            Object.assign(container[indexOfObj], remoteObj);
            return container[indexOfObj];
        },

        listTC: function (tp, list) {
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                for (var tc = 0; tc < tp.testCaseGroups[tcg].testCases.length; tc++) {
                    list.push(tp.testCaseGroups[tcg].testCases[tc]);
                }
            }
            for (var tci = 0; tci < tp.testCases.length; tci++) {
                list.push(tp.testCases[tci]);
            }
        },
        synchronizeTC: function (tp, id, tc) {
            var indexOfObj;
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                indexOfObj = testObjectService.index(tp.testCaseGroups[tcg].testCases, "id", id);
                if (~indexOfObj) {
                    this.updateHash(tc);
                    tp.testCaseGroups[tcg].testCases[indexOfObj] = tc;
                    return tp.testCaseGroups[tcg].testCases[indexOfObj];
                }
            }
            indexOfObj = testObjectService.index(tp.testCases, "id", id);
            if (~indexOfObj) {
                tp.testCases[indexOfObj] = tc;
                return tp.testCases[indexOfObj];
            }
        },

        lookUp: function (tcId, tp) {
            var indexOfObj;
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                indexOfObj = testObjectService.index(tp.testCaseGroups[tcg].testCases, "id", id);
                if (~indexOfObj) {
                    return true;
                }
            }
            indexOfObj = testObjectService.index(tp.testCases, "id", id);
            return ~indexOfObj;
        },

        index: function (container, key, value) {
            for (var i = 0; i < container.length; i++) {
                if (typeof container[i] === 'object' && container[i].hasOwnProperty(key) && container[i][key] === value) {
                    return i;
                }
            }
            return -1;
        },

        markWithCLID: function (obj) {
            obj.id = "cl_" + testObjectService.generateUID();
        },

        isLocal: function (obj) {
            return obj.hasOwnProperty("id") && typeof obj.id === 'string' ? (obj.id.indexOf("cl_") === 0 ? true : false) : true;
            //return true;
        },

        isLocalID: function (id) {
            return typeof id === 'string' ? (id.indexOf("cl_") === 0 ? true : false) : true;
        },

        generateUID: function () {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        prepare: function (tc) {
            var _tc = JSON.parse(angular.toJson(tc));
            if (_tc.hasOwnProperty("position")) {
                delete _tc.position;
            }
            if (testObjectService.isLocal(_tc)) {
                delete _tc.id;
            }
            testObjectService.cleanDates(_tc);
            testObjectService.cleanObject(_tc, new RegExp("^_.*"));
            return _tc;
        },
        updateDose: function (events) {
            var groups = _.groupBy(events, function (item) {
                return item.vaccination.administred ? item.vaccination.administred.name : "new";
            });

            for (var group in groups) {
                var list = groups[group];
                for (var i = 0; i < list.length; i++) {
                    list[i].vaccination.doseNumber = i + 1;
                }
            }
        }
    };
    return testObjectService;
});

angular.module('tcl').factory('TestObjectFactory', function (TestObjectUtil) {
    var testObjectService = {
        createFD: function () {
            var dt = new Date();
            return {
                type: 'fixed',
                date: dt.getTime(),
                _dateObj: dt
            }
        },
        createRD: function () {
            return {
                type: 'relative',
                rules: []
            }
        },
        createGRP: function (id) {
            return {
                id: "cl_" + TestObjectUtil.generateUID(),
                name: 'New Group',
                testPlan: id,
                testCases: []
            }
        },
        createREVD: function () {
            return {
                type: 'relative',
                rules: [
                    {
                        position: 'BEFORE',
                        year: 0,
                        month: 0,
                        day: 0,
                        relativeTo: {
                            reference: 'static',
                            id: 'EVALDATE'
                        }
                    }
                ]
            }
        },
        createRDOB: function () {
            return {
                type: 'relative',
                rules: [
                    {
                        position: 'BEFORE',
                        year: 0,
                        month: 0,
                        day: 0,
                        relativeTo: {
                            reference: 'static',
                            id: 'EVALDATE'
                        }
                    }
                ]
            }
        },
        createTC: function (tp,grp) {
            var dt = new Date();
            var tc = {
                name: "New TC",
                _changed: true,
                description: "",
                dateType: 'FIXED',
                _dateType: 'FIXED',
                testPlan: tp,
                group : grp,
                patient: {
                    dob: testObjectService.createFD(),
                    gender: null
                },
                metaData: {
                    version: 1,
                    imported: false,
                    dateCreated: dt.getTime(),
                    dateLastUpdated: dt.getTime()
                },
                evalDate: testObjectService.createFD(),
                events: [],
                forecast: []
            };
            TestObjectUtil.sanitizeDates(tc);
            TestObjectUtil.markWithCLID(tc);
            return tc;
        },

        createTP: function () {
            var dt = new Date();
            var tp = {
                name: "New Test Plan",
                description: "",
                metaData: {
                    version: "1",
                    imported: false,
                    dateCreated: dt.getTime(),
                    dateLastUpdated: dt.getTime()
                },
                testCases: [],
                testCaseGroups: []
            };
            TestObjectUtil.sanitizeDates(tp);
            TestObjectUtil.markWithCLID(tp);
            return tp;
        },

        createEvent: function (pos, t) {
            var dt;
            if (t === 'FIXED') {
                dt = testObjectService.createFD();
            }
            else {
                dt = testObjectService.createRD();
            }
            var ev = {
                _type: "vaccination",
                vaccination: {
                    administred: null,
                    evaluations: [],
                    type: "VACCINATION",
                    date: dt,
                    doseNumber: 1,
                    position: pos
                }
            };
            return ev;
        },

        createForecast: function (t) {
            var earliest;
            var recomm;
            if (t === 'FIXED') {
                earliest = testObjectService.createFD();
                recomm = testObjectService.createFD();
            }
            else {
                earliest = testObjectService.createRD();
                recomm = testObjectService.createRD();
            }
            var fc = {
                doseNumber: 0,
                forecastReason: "",
                earliest: earliest,
                recommended: recomm,
                pastDue: null,
                target: null
            };
            return fc;
        },

        createEvaluation: function () {
            return {
                relatedTo: null,
                status: null
            };
        }

    };
    return testObjectService;
});

angular.module('tcl').factory('TestObjectSynchronize', function ($q, $http, TestObjectUtil) {
    var TestObjectSynchronize = {
        updateTestGroupId: function (tg) {
            for (var tc = 0; tc < tg.testCases.length; tc++) {
                tg.testCases[tc].group = tg.id;
            }
        },
        updateTestPlanId: function (tp) {
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                for (var tc = 0; tc < tp.testCaseGroups[tcg].testCases.length; tc++) {
                    tp.testCaseGroups[tcg].testCases[tc].testPlan = tp.id;
                }
                tp.testCaseGroups[tcg].testPlan = tp.id;
            }
            for (var tci = 0; tci < tp.testCases.length; tci++) {
                tp.testCases[tci].testPlan = tp.id;
            }
        },
        syncTC: function (where, id, tc) {
            var deferred = $q.defer();
            if (TestObjectUtil.isLocalID(id)) {
                console.log("Cannot Save, Local TP, Must Save");
                deferred.reject({
                    message: "TestPlan must be saved first",
                    status: false,
                    code: "LOCAL"
                });
            }
            else {
                var _tc = TestObjectSynchronize.prepare(tc);
                console.log("Saving ");
                $http.post('api/testcase/' + where + '/' + id + '/save', _tc).then(
                    function (response) {
                        var newTC = response.data;
                        TestObjectUtil.sanitizeDates(newTC);
                        TestObjectUtil.sanitizeEvents(newTC);
                        newTC._dateType = newTC.dateType;
                        deferred.resolve({
                            status: true,
                            message: "TestCase Saved",
                            tc: newTC
                        });
                    },
                    function (response) {
                        deferred.reject({
                            status: false,
                            message: "Error While Saving TestCase",
                            response: response.data
                        });
                    }
                );
            }
            return deferred.promise;
        },
        syncTP: function (tp) {
            var deferred = $q.defer();
            var _tp = JSON.parse(angular.toJson(tp));
            delete _tp.testCases;
            delete _tp.testCaseGroups;
            _tp = TestObjectSynchronize.prepare(_tp);

            $http.post('api/testplan/partial/save', _tp).then(
                function (response) {
                    var newTP = response.data;

                    deferred.resolve({
                        status: true,
                        tp: newTP,
                        message: "TestPlan Saved"
                    });
                },
                function (response) {
                    deferred.reject({
                        status: false,
                        message: "Error While Saving TestPlan",
                        response: response.data
                    });
                }
            );

            return deferred.promise;
        },
        syncTG: function (tg) {
            var deferred = $q.defer();
            if (TestObjectUtil.isLocalID(tg.testPlan)) {
                console.log("Cannot Save, Local TG, Must Save");
                deferred.reject({
                    message: "TestGroup must be saved first",
                    status: false,
                    code: "LOCAL"
                });
            }
            else {

                var _tg = JSON.parse(angular.toJson(tg));
                delete _tg.testCases;
                _tg = TestObjectSynchronize.prepare(_tg);

                $http.post('api/testCaseGroup/partial/save', _tg).then(
                    function (response) {
                        var newTCG = response.data;
                        deferred.resolve({
                            status: true,
                            tg: newTCG,
                            message: "TestCaseGroup Saved"
                        });
                    },
                    function (response) {
                        deferred.reject({
                            status: false,
                            message: "Error While Saving TestCaseGroup",
                            response: response.data
                        });
                    }
                );
            }
            return deferred.promise;
        },
        mergeTP: function (local, remote) {
            local.id = remote.id;
            local.name = remote.name;
            local.description = remote.description;
            local.metaData = remote.metaData;

            for (var tc in remote.testCases) {
                var i = TestObjectUtil.index(local.testCases, "id", remote.testCases[tc].id);
                local.testCases[i] = remote.testCases[tc];
            }
        },
        prepare: function (tc) {
            var _tc = JSON.parse(angular.toJson(tc));
            if (_tc.hasOwnProperty("position")) {
                delete _tc.position;
            }
            if (TestObjectUtil.isLocal(_tc)) {
                delete _tc.id;
            }
            TestObjectUtil.cleanDates(_tc);
            TestObjectUtil.cleanObject(_tc, new RegExp("^_.*"));
            return _tc;
        }
    };
    return TestObjectSynchronize;
});

angular.module('tcl').factory('TestDataService', function ($http, $q, TestObjectUtil) {
    return {
        loadTestPlans: function () {
            var deferred = $q.defer();
            var tps = [];
            $http.get('api/testplans').then(
                function (response) {
                    tps = angular.fromJson(response.data);
                    TestObjectUtil.sanitizeDates(tps);
                    for (var tp = 0; tp < tps.length; tp++) {
                        for (var tc = 0; tc < tps[tp].testCases.length; tc++) {
                            tps[tp].testCases[tc]._dateType = tps[tp].testCases[tc].dateType;
                            TestObjectUtil.sanitizeEvents(tps[tp].testCases[tc]);
                        }
                        for (var tg = 0; tg < tps[tp].testCaseGroups.length; tg++) {
                            for (var tci = 0; tci < tps[tp].testCaseGroups[tg].testCases.length; tci++) {
                                tps[tp].testCaseGroups[tg].testCases[tci]._dateType = tps[tp].testCaseGroups[tg].testCases[tci].dateType;
                                TestObjectUtil.sanitizeEvents(tps[tp].testCaseGroups[tg].testCases[tci]);
                            }
                            TestObjectUtil.hash(tps[tp].testCaseGroups[tg].testCases);
                        }
                        TestObjectUtil.hash(tps[tp].testCases);
                    }
                    deferred.resolve(tps);
                },
                function (error) {
                    deferred.reject("Failed to load TestPlans");
                });
            return deferred.promise;
        },

        loadEnums: function () {
            var deferred = $q.defer();
            var enums = {};
            $http.get('api/enum/evaluationStatus').then(
                function (response) {
                    enums.evalStatus = response.data;
                    $http.get('api/enum/evaluationReason').then(
                        function (response) {
                            enums.evalReason = response.data;
                            $http.get('api/enum/serieStatus').then(
                                function (response) {
                                    enums.serieStatus = response.data;
                                    $http.get('api/enum/gender').then(
                                        function (response) {
                                            enums.gender = response.data;
                                            deferred.resolve(enums);
                                        },
                                        function (error) {
                                            deferred.reject("Failed To Load Genders");
                                        }
                                    );
                                },
                                function (error) {
                                    deferred.reject("Failed To Load Serie Status");
                                }
                            );
                        },
                        function (error) {
                            deferred.reject("Failed To Load Evaluation Reason");
                        }
                    );
                },
                function (error) {
                    deferred.reject("Failed To Load Evaluation Status");
                }
            );
            return deferred.promise;
        }
    }
});

angular.module('tcl').factory('TestObjectSchema', function () {
    return {
        config: {
            ids: {
                active: true,
                separator: "-"
            }
        },
        types: {
            idType: {
                choice: [
                    {
                        id: "N",
                        options: {
                            min: 0
                        },
                        discriminator: function (doc, parent) {
                            return typeof parent.id === "number"
                        }
                    },
                    {
                        id: "S",
                        discriminator: function (doc, parent) {
                            return typeof parent.id !== "number"
                        }
                    }
                ]
            },
            date: {
                id: "O",
                model: [
                    {
                        choice: [
                            {
                                key: "fixed",
                                name: "Fixed",
                                id: "fx",
                                typeRef: "fixedDate",
                                usage: "R",
                                discriminator: function (parent, obj) {
                                    return !parent.hasOwnProperty("relative");
                                }
                            },
                            {
                                key: "relative",
                                name: "Relative",
                                id: "rl",
                                typeRef: "relativeDate",
                                usage: "R",
                                discriminator: function (parent, obj) {
                                    return !parent.hasOwnProperty("fixed");
                                }
                            },
                        ]
                    }
                ]
            },

            fixedDate: {
                id: "O",
                model: [
                    {
                        key: "id",
                        id: "id",
                        name: "ID",
                        typeRef: "idType",
                        usage: "O"
                    },
                    {
                        key: "date",
                        id: "dt",
                        name: "DateObj",
                        type: {
                            id: "N",
                            options: {
                                min: 0
                            }
                        },
                        usage: "R"
                    }
                ]
            },

            relativeDate: {
                id: "O",
                model: [
                    {
                        key: "id",
                        id: "id",
                        name: "ID",
                        typeRef: "idType",
                        usage: "O"
                    },
                    {
                        key: "relativeTo",
                        id: "rlt",
                        name: "Relative To",
                        type: {
                            id: "S",
                            options: {
                                min: 5
                            }
                        },
                        usage: "R"
                    },
                    {
                        key: "years",
                        id: "y",
                        name: "Years",
                        type: {
                            id: "N"
                        },
                        usage: "R"
                    },
                    {
                        key: "months",
                        id: "m",
                        name: "Months",
                        type: {
                            id: "N"
                        },
                        usage: "R"
                    },
                    {
                        key: "days",
                        id: "d",
                        name: "days",
                        type: {
                            id: "N"
                        },
                        usage: "R"
                    }
                ]
            }

        }
    };
});
